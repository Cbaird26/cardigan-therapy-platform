const githubPagesBasePath =
  process.env.STATIC_EXPORT === "true" ? "/cardigan-therapy-platform" : "";

export function publicPath(path: string) {
  return `${githubPagesBasePath}${path.startsWith("/") ? path : `/${path}`}`;
}
