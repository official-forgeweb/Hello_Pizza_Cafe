import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/jwt";

function isAuthenticated(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) return false;
  return verifyAdminToken(token) !== null;
}

export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";

    // 1. Calculate Stats
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Points earned today
    const earnedTodayTx = await prisma.loyaltyTransaction.aggregate({
      where: {
        type: { in: ["EARN", "BONUS"] },
        timestamp: { gte: startOfToday }
      },
      _sum: {
        points: true
      }
    });

    // Points redeemed today
    const redeemedTodayTx = await prisma.loyaltyTransaction.aggregate({
      where: {
        type: "REDEEM",
        timestamp: { gte: startOfToday }
      },
      _sum: {
        points: true
      }
    });

    // Total active/available points in system
    const activePointsTx = await prisma.loyaltyTransaction.aggregate({
      _sum: {
        points: true
      }
    });

    // Points expiring soon (next 7 days)
    const expiringSoonTx = await prisma.loyaltyTransaction.aggregate({
      where: {
        type: "EARN",
        expiryDate: {
          gte: now,
          lte: next7Days
        }
      },
      _sum: {
        points: true
      }
    });

    // 2. Fetch Transactions Logs
    const whereClause: any = {};
    if (type) {
      whereClause.type = type;
    }
    if (search) {
      whereClause.OR = [
        { phoneNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const transactions = await prisma.loyaltyTransaction.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            name: true,
            phone: true
          }
        }
      },
      orderBy: {
        timestamp: "desc"
      },
      take: 200
    });

    // 3. Compute Expiring Points Alerts (expiring in next 30 days)
    const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    // Find unique phone numbers with transactions expiring within the next 30 days
    const expiringTxs = await prisma.loyaltyTransaction.findMany({
      where: {
        type: { in: ["EARN", "BONUS"] },
        expiryDate: {
          gt: now,
          lte: next30Days
        }
      },
      select: {
        phoneNumber: true
      }
    });
    
    const uniquePhones = Array.from(new Set(expiringTxs.map(tx => tx.phoneNumber)));
    
    const customersWithTxs = uniquePhones.length > 0 
      ? await prisma.customer.findMany({
          where: {
            phone: { in: uniquePhones }
          },
          select: {
            name: true,
            phone: true,
            loyaltyTransactions: {
              orderBy: { timestamp: "asc" }
            }
          }
        })
      : [];

    const expiringAlerts: {
      customerId: string;
      customerName: string;
      customerPhone: string;
      points: number;
      expiryDate: string;
      daysRemaining: number;
    }[] = [];

    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    customersWithTxs.forEach(customer => {
      const txs = customer.loyaltyTransactions;
      const availableList: { points: number; expiryDate: Date | null }[] = [];
      let redeemedTotal = 0;

      txs.forEach(tx => {
        if (tx.points > 0) {
          const isPending = tx.type === 'EARN' && tx.timestamp > oneDayAgo;
          const isExpired = tx.expiryDate && tx.expiryDate <= now;
          
          if (!isPending && !isExpired) {
            availableList.push({ points: tx.points, expiryDate: tx.expiryDate });
          }
        } else {
          redeemedTotal += Math.abs(tx.points);
        }
      });

      availableList.forEach(item => {
        if (redeemedTotal >= item.points) {
          redeemedTotal -= item.points;
          item.points = 0;
        } else {
          item.points -= redeemedTotal;
          redeemedTotal = 0;
          
          if (item.points > 0 && item.expiryDate) {
            const diffTime = item.expiryDate.getTime() - now.getTime();
            const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // Show points expiring in the next 30 days
            if (daysRemaining > 0 && daysRemaining <= 30) {
              expiringAlerts.push({
                customerId: customer.phone,
                customerName: customer.name || "Walk-in Customer",
                customerPhone: customer.phone,
                points: item.points,
                expiryDate: item.expiryDate.toISOString(),
                daysRemaining
              });
            }
          }
        }
      });
    });

    // Sort expiring alerts by days remaining ascending (soonest first)
    expiringAlerts.sort((a, b) => a.daysRemaining - b.daysRemaining);

    return NextResponse.json({
      stats: {
        earnedToday: earnedTodayTx._sum.points || 0,
        redeemedToday: Math.abs(redeemedTodayTx._sum.points || 0),
        activePoints: activePointsTx._sum.points || 0,
        expiringSoon: expiringSoonTx._sum.points || 0
      },
      transactions,
      expiringAlerts
    });
  } catch (error: any) {
    console.error("Error in GET admin loyalty:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
