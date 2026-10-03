import { Dialog } from '@base-ui/react/dialog';
import { CloseIcon } from './CloseIcon';

export function DialogCloseButton({ label }: { label: string }) {
  return <Dialog.Close className="close-control dialog-close" aria-label={label}>
    <CloseIcon />
  </Dialog.Close>;
}
