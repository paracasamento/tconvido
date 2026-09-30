import { Monogram } from "@/components/Monogram";
import { inviteDesign } from "@/lib/invite-design";

export function InvitationHero({
  coupleNames,
  eventTitle
}: {
  coupleNames: string;
  eventTitle: string;
}) {
  const hero = inviteDesign.hero;
  const hasHeroImage = hero.mode === "image" && !!hero.imageUrl;

  return (
    <section className={`public-hero ${hasHeroImage ? "public-hero--image" : "public-hero--composition"}`}>
      {hasHeroImage ? (
        <>
          <div className="public-hero-media" aria-hidden>
            <img
              src={hero.imageUrl!}
              alt=""
              className="public-hero-image"
              style={{ objectPosition: hero.imagePosition, opacity: hero.imageOpacity }}
            />
            <span className="public-hero-overlay" style={{ opacity: hero.overlayOpacity }} />
          </div>
          {hero.showTextOnImage && (
            <div className="public-hero-content public-hero-content--on-image">
              <Monogram size={76} priority />
              <p className="public-couple-name">{coupleNames}</p>
              <h1>{eventTitle}</h1>
            </div>
          )}
        </>
      ) : (
        <div className="public-hero-stationery">
          <span className="public-hero-frame" aria-hidden />
          <img
            src="/florals/floral-divider.webp"
            alt=""
            className="public-hero-divider public-hero-divider--top"
            aria-hidden
          />

          <div className="public-hero-content">
            <Monogram size={86} priority />
            <div className="public-hero-rule" aria-hidden>
              <span />
              <b>♡</b>
              <span />
            </div>
            <p className="public-couple-name">{coupleNames}</p>
            <h1>{eventTitle}</h1>
          </div>

          <img
            src="/florals/floral-divider.webp"
            alt=""
            className="public-hero-divider public-hero-divider--bottom"
            aria-hidden
          />
        </div>
      )}

      <a className="public-scroll-cue" href="#acoes" aria-label="Continuar no convite">
        <span>Continuar</span>
        <i aria-hidden>⌄</i>
      </a>
    </section>
  );
}
