export const createSvgPlaceholder = (
  label,
  background = '#e9eef5',
  foreground = '#2a3950',
  width = 800,
  height = 560
) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="${background}" rx="28" ry="28" />
      <text
        x="50%"
        y="50%"
        dominant-baseline="middle"
        text-anchor="middle"
        fill="${foreground}"
        font-family="Segoe UI, Microsoft YaHei, sans-serif"
        font-size="64"
        letter-spacing="8"
      >${label}</text>
    </svg>
  `

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}
