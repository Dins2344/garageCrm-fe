import { PLAY_STORE_URL } from '../utils/constants';

interface Props {
  className?: string;
}

/** Google's official "Get it on Google Play" badge, linking to the listing. */
export default function PlayStoreBadge({ className = '' }: Props) {
  return (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Download GaragePulse for Android on Google Play (opens in a new tab)"
      className={`inline-block ${className}`}
    >
      <img src="/playstore.png" alt="" width={584} height={176} className="h-12 w-auto" />
    </a>
  );
}
