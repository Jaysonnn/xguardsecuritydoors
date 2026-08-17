import { site } from "@/config/site";
import { MessageIcon, PhoneIcon } from "@/components/ui/Icon";

/**
 * Fixed bottom bar, mobile only. Styling lives in globals.css under .call-bar
 * because it predates the CSS Module convention and works as is.
 */
export function CallBar() {
  return (
    <nav className="call-bar" aria-label="Quick contact">
      <a className="call" href={site.phoneHref}>
        <PhoneIcon size={18} />
        Call now
      </a>
      <a className="sms" href={site.smsHref}>
        <MessageIcon size={18} />
        Text a photo
      </a>
    </nav>
  );
}
