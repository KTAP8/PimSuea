import { Link, type LinkProps } from 'react-router-dom';
import { localizedPath } from '@/content/marketingRoutes';
import { useRouteLang } from '@/i18n/LanguageContext';

/** Router link that keeps the /th prefix on Thai marketing pages. Outside marketing it is a plain Link. */
export function LocalizedLink({ to, ...rest }: LinkProps & { to: string }) {
  const lang = useRouteLang();
  return <Link to={lang ? localizedPath(to, lang) : to} {...rest} />;
}
