type Embed =
  | { kind: "iframe"; src: string; shape: "tall" | "wide" | "instagram" }
  | { kind: "video"; src: string }
  | { kind: "link"; src: string; host: string };

const YOUTUBE_ID = /^[\w-]{6,}$/;

/** Works out how to show a reel link: an embedded player when the site allows it, otherwise a plain link. */
function toEmbed(link: string): Embed | null {
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.replace(/^(www|m)\./, "");
  const segments = url.pathname.split("/").filter(Boolean);
  const [first, second] = segments;

  if (host === "youtube.com" || host === "youtu.be") {
    const id = host === "youtu.be" ? first : first === "watch" ? url.searchParams.get("v") : second;
    if (id && YOUTUBE_ID.test(id) && (host === "youtu.be" || ["watch", "shorts", "embed", "live"].includes(first))) {
      return { kind: "iframe", src: `https://www.youtube.com/embed/${id}`, shape: first === "shorts" ? "tall" : "wide" };
    }
  }

  if (host === "instagram.com") {
    // Share links look like /reel/CODE/ or /username/reel/CODE/.
    const at = segments.findIndex((s) => ["reel", "reels", "p", "tv"].includes(s));
    const code = at >= 0 ? segments[at + 1] : undefined;
    if (code) {
      const type = segments[at] === "p" ? "p" : "reel";
      return {
        kind: "iframe",
        src: `https://www.instagram.com/${type}/${encodeURIComponent(code)}/embed/`,
        shape: "instagram",
      };
    }
  }

  if (/\.(mp4|webm|mov|m4v)$/i.test(url.pathname)) return { kind: "video", src: url.href };

  return { kind: "link", src: url.href, host };
}

export default function Reel({ url, title }: { url: string; title: string }) {
  const embed = toEmbed(url);
  if (!embed) return null;

  if (embed.kind === "link") {
    return (
      <a className="reel-link" href={embed.src} target="_blank" rel="noopener nofollow">
        ▶ Watch the reel on {embed.host} ↗
      </a>
    );
  }

  if (embed.kind === "video") {
    return <video className="reel-frame tall" src={embed.src} controls playsInline preload="metadata" />;
  }

  return (
    <iframe
      className={`reel-frame ${embed.shape}`}
      src={embed.src}
      title={`Reel: ${title}`}
      loading="lazy"
      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      allowFullScreen
    />
  );
}
