'use client';

import { Button, CopyButton } from '@mantine/core';
import styles from './copy-email.module.css';

// Attributes the page hands down to spread on the button; what they mean is the page's business
type Tracking = { className?: string; [key: `data-${string}`]: string | undefined };

type CopyEmailProps = { address: string; copyLabel: string; copiedLabel: string; tracking: Tracking };

// CopyButton hands its state to a render function, so it lives in this island; the strings arrive translated. The live region is
// polite and not a status role: it only echoes what the button already says
export const CopyEmail = ({ address, copyLabel, copiedLabel, tracking }: CopyEmailProps) => (
  <CopyButton value={address} timeout={2000}>
    {({ copied, copy }) => (
      <>
        <Button variant="default" onClick={copy} {...tracking}>
          {copied ? copiedLabel : copyLabel}
        </Button>
        <span aria-live="polite" className={styles.announce}>
          {copied && copiedLabel}
        </span>
      </>
    )}
  </CopyButton>
);
