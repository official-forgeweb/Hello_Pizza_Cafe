const wabaId = "1537003751365349";
const accessToken = "EAANYf9MRdaMBRTMiCCYC7QgxeCku2LkK8Q2GL9d1KkD0sEuZCVdyEhWTycHO799hdKGMLwgfzbkzrZCN7kZBZAaYEOGjpOVPxl7iA5lKcHRnSRRUhQU1ZBJ2LF5hvbJptcz6yj6nYT4wIZAOnMFM9fklhbptzuOaYGB30Cal4QFHWOAgTFMbeDN41k16o7ZCAZDZD";
const apiVersion = "v21.0";

async function run() {
  const name = "order_pay_ref";
  const payload = {
    name: name,
    category: "UTILITY",
    language: "en_US",
    components: [
      {
        type: "BODY",
        text: "Hi {{1}}! Your order transaction reference is {{2}} for your Hello Pizza Cafe purchase.",
        example: {
          body_text: [
            ["Rahul Sharma", "10482"]
          ]
        }
      },
      {
        type: "FOOTER",
        text: "Hello Pizza Cafe"
      }
    ]
  };

  console.log("Sending UTILITY template create payload to Meta...");
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${wabaId}/message_templates`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );
    const data = await response.json();
    console.log("Meta API Response status:", response.status);
    console.log("Meta API Response data:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error calling Meta API:", err);
  }
}

run();
