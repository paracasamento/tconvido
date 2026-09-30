type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function AdminPageHeader({ eyebrow, title, description, action }: Props) {
  return (
    <header className="admin-page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="admin-page-header__action">{action}</div>}
    </header>
  );
}
