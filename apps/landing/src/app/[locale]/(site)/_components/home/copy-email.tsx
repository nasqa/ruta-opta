'use client';

import { Button, CopyButton } from '@mantine/core';
import styles from './copy-email.module.css';

type CopyEmailProps = { address: string; copyLabel: string; copiedLabel: string };

// CopyButton hands its state to a render function, so it lives in this island; the strings arrive translated. The live region is
// polite and not a status role: it only echoes what the button already says
export const CopyEmail = ({ address, copyLabel, copiedLabel }: CopyEmailProps) => (
  <CopyButton value={address} timeout={2000}>
    {({ copied, copy }) => (
      <>
        <Button variant="default" onClick={copy}>
          {copied ? copiedLabel : copyLabel}
        </Button>
        <span aria-live="polite" className={styles.announce}>
          {copied && copiedLabel}
        </span>
      </>
    )}
  </CopyButton>
);
