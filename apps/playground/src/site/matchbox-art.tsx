export function MatchboxArt() {
  return (
    <div className="matchbox-art" aria-hidden="true">
      <svg viewBox="0 0 800 600" fill="none">
        <defs>
          <linearGradient
            id="lid"
            x1="210"
            y1="135"
            x2="540"
            y2="400"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#444444" />
            <stop offset=".3" stopColor="#1b1b1b" />
            <stop offset=".75" stopColor="#101010" />
            <stop offset="1" stopColor="#272727" />
          </linearGradient>
          <linearGradient
            id="edge"
            x1="300"
            y1="360"
            x2="640"
            y2="300"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#202020" />
            <stop offset=".5" stopColor="#090909" />
            <stop offset="1" stopColor="#282828" />
          </linearGradient>
          <linearGradient
            id="rim"
            x1="190"
            y1="180"
            x2="640"
            y2="390"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#939393" />
            <stop offset=".4" stopColor="#282828" />
            <stop offset="1" stopColor="#d7a983" />
          </linearGradient>
          <linearGradient id="wood" x1="0" y1="0" x2="12" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#654431" />
            <stop offset=".4" stopColor="#c2976b" />
            <stop offset="1" stopColor="#452d23" />
          </linearGradient>
          <radialGradient id="light">
            <stop stopColor="#ec612b" stopOpacity=".18" />
            <stop offset="1" stopColor="#ec612b" stopOpacity="0" />
          </radialGradient>
          <pattern id="striker" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#626262" />
          </pattern>
          <filter id="soft">
            <feGaussianBlur stdDeviation="18" />
          </filter>
        </defs>
        <ellipse cx="470" cy="350" rx="285" ry="220" fill="url(#light)" />
        <ellipse cx="413" cy="465" rx="210" ry="28" fill="#010101" filter="url(#soft)" />
        <g className="matchbox-object">
          <path d="M205 196L514 119L651 307L329 412Z" fill="#0e0e0e" stroke="#4e4e4e" />
          <path d="M205 196L329 412V450L205 237Z" fill="#242424" stroke="#393939" />
          <path d="M329 412L651 307V347L329 450Z" fill="url(#edge)" stroke="#404040" />
          <path d="M340 420L639 323V338L340 435Z" fill="url(#striker)" />
          <path
            d="M205 184L514 108L651 297L329 400Z"
            fill="url(#lid)"
            stroke="url(#rim)"
            strokeWidth="1.4"
          />
          <path d="M205 184V196L329 412V400Z" fill="#191919" stroke="#333333" />
          <path
            d="M329 400L651 297V307L329 412Z"
            fill="#191919"
            stroke="#555555"
            strokeWidth=".6"
          />
          <path d="M219 187L510 116" stroke="#ababab" strokeOpacity=".65" />
          <path d="M337 397L643 298" stroke="#d0a78c" strokeOpacity=".45" />
          <g transform="matrix(.9 -.24 .53 .77 268 219)">
            <text
              x="0"
              y="52"
              fontFamily="Geist Variable, sans-serif"
              fontSize="58"
              fontWeight="600"
              letterSpacing="-4"
              fill="#888888"
            >
              matchbox
            </text>
            <path d="M2 72H259" stroke="#5b5b5b" strokeWidth=".6" />
            <text
              x="3"
              y="98"
              fontFamily="Geist Mono Variable, monospace"
              fontSize="10"
              letterSpacing="3"
              fill="#707070"
            >
              SMALL LEARNED FUNCTIONS
            </text>
            <path d="M6 122L6 172M17 122L17 172M28 122L28 172" stroke="#c3673e" strokeWidth="4" />
            <circle cx="6" cy="122" r="4" fill="#e38654" />
            <circle cx="17" cy="122" r="4" fill="#e38654" />
            <circle cx="28" cy="122" r="4" fill="#e38654" />
            <text
              x="191"
              y="164"
              fontFamily="Geist Mono Variable, monospace"
              fontSize="11"
              fill="#737373"
            >
              .model
            </text>
          </g>
        </g>
        <g transform="translate(620 360) rotate(33)">
          <rect width="10" height="150" rx="2" fill="url(#wood)" />
          <rect x="-2" y="-10" width="14" height="23" rx="7" fill="#b94622" />
          <path d="M0 -4Q4 -11 9 -4" stroke="#ffb488" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}
