import Link from "next/link";
import { MapPin, Clock, Phone, Mail, Globe, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-warm-900 text-warm-300">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <span className="text-2xl font-extrabold tracking-tight text-white">
              Hello<span className="text-primary">Pizza</span>
            </span>
            <p className="mt-4 text-warm-400 max-w-md leading-relaxed text-sm">
              Delivering hot, fresh, and delicious pizzas right to your doorstep.
              Crafted with the finest ingredients and baked to perfection with love.
            </p>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center gap-2.5 text-warm-400">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                Main Market, Ballabhgarh, Faridabad, Haryana 121004
              </div>
              <div className="flex items-center gap-2.5 text-warm-400">
                <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                Open 11:00 AM — 11:00 PM (All days)
              </div>
              <div className="flex items-center gap-2.5 text-warm-400">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                085860 76383
              </div>
              <div className="flex items-center gap-2.5 text-warm-400">
                <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                hello@hellopizza.in
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-5">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              {[
                { href: "/menu", label: "Our Menu" },
                { href: "/cart", label: "My Cart" },
                { href: "/track", label: "Track Order" },
                { href: "/about", label: "About Us" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-warm-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-5">Legal</h4>
            <ul className="space-y-3 text-sm">
              {[
                { href: "/privacy", label: "Privacy Policy" },
                { href: "/terms", label: "Terms of Service" },
                { href: "/refund", label: "Refund Policy" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-warm-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Socials */}
            <div className="mt-8">
              <h4 className="text-white font-semibold mb-3">Follow Us</h4>
              <div className="flex items-center gap-3">
                {[
                  { icon: Globe, href: "#", label: "Website" },
                  { icon: Heart, href: "#", label: "Instagram" },
                ].map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-warm-800 text-warm-400 hover:bg-primary hover:text-white transition-all"
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-warm-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-warm-500 text-sm">
            © {new Date().getFullYear()} Hello Pizza. All rights reserved.
          </p>
          <p className="text-warm-600 text-xs">
            Made with ❤️ in Ballabhgarh
          </p>
        </div>
      </div>
    </footer>
  );
}
