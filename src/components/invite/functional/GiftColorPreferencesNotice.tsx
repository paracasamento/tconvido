export type GiftColorPreference = {
  name: string;
  hex: string;
};

export function GiftColorPreferencesNotice({
  colors,
}: {
  colors: GiftColorPreference[];
}) {
  if (!colors.length) return null;

  return (
    <div className="gift-color-preferences-notice">
      <div className="gift-color-preferences-notice__copy">
        <strong>Cores de preferência</strong>
        <span>Se houver opção de cor, estas são as preferidas dos noivos.</span>
      </div>

      <div className="gift-color-preferences-swatches" aria-label="Cores de preferência">
        {colors.map((color, index) => (
          <span className="gift-color-preference" key={`${color.hex}-${index}`}>
            <i style={{ backgroundColor: color.hex }} aria-hidden="true" />
            {color.name ? <small>{color.name}</small> : null}
          </span>
        ))}
      </div>
    </div>
  );
}
