import { FaXTwitter, FaLinkedinIn, FaInstagram, FaFacebookF } from "react-icons/fa6";
import "../styles/footer.css";

const SOCIALS = [
  { name: "X", href: "https://x.com/yourhandle", icon: FaXTwitter },
  { name: "LinkedIn", href: "https://linkedin.com/company/yourpage", icon: FaLinkedinIn },
  { name: "Instagram", href: "https://instagram.com/yourhandle", icon: FaInstagram },
  { name: "Facebook", href: "https://facebook.com/yourpage", icon: FaFacebookF },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Left: copyright */}
        <p className="footer-copy">
          © {new Date().getFullYear()} LendConnect. All rights reserved.
        </p>

        {/* Right: social links */}
        <div className="footer-socials">
          {SOCIALS.map(({ name, href, icon: Icon }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={name}
            >
              <Icon />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}