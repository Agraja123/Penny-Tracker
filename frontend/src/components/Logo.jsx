// A simple, custom wallet-with-coin mark used as the Penny Tracker logo.
// Pure SVG so it scales cleanly from the splash screen down to nav icons.
const Logo = ({ size = 64, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="8" y="28" width="70" height="52" rx="10" fill="#0E7C66" />
    <rect x="8" y="28" width="70" height="16" rx="8" fill="#0A5F4F" />
    <circle cx="68" cy="60" r="9" fill="#FBF8F1" />
    <circle cx="68" cy="60" r="9" fill="none" stroke="#0A5F4F" strokeWidth="2" />
    <circle cx="55" cy="46" r="20" fill="#F0A93B" stroke="#20302B" strokeWidth="3" />
    <circle cx="55" cy="46" r="13" fill="none" stroke="#20302B" strokeWidth="1.6" strokeDasharray="2.5 3.5" />
    <text
      x="55"
      y="53"
      fontFamily="Poppins, sans-serif"
      fontSize="20"
      fontWeight="700"
      textAnchor="middle"
      fill="#20302B"
    >
      ₹
    </text>
  </svg>
);

export default Logo;
