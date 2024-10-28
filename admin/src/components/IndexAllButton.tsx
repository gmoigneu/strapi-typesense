import { Button, Dialog } from '@strapi/design-system';
import { WarningCircle } from '@strapi/icons';
import { Play } from '@strapi/icons';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import axios from 'axios';

const IndexAllButton = ({ contentType }: { contentType: string }) => {
  const { formatMessage } = useIntl();

  const abortController = new AbortController();
  const { signal } = abortController;

  useEffect(() => {
    return () => {
      abortController.abort();
    };
  }, []);

  const handleConfirmIndexAll = async () => {
    axios.post(`/strapi-typesense/index-all`, {
      contentType: contentType
    }).then((response) => {
      console.log(response);
    });
  };

  return (
    <>
      <Dialog.Root>
        <Dialog.Trigger>
          <Button
            size="S"
            startIcon={<Play />}
            variant="default"
          >
            {formatMessage({
              id: 'cache.purge.delete-entry',
              defaultMessage: 'Index all items',
            })}
          </Button>
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Header>Confirmation</Dialog.Header>
          <Dialog.Body icon={<WarningCircle fill="danger600" />}>Are you sure you want to index all items?</Dialog.Body>
          <Dialog.Footer>
            <Dialog.Cancel>
              <Button fullWidth variant="tertiary">
                Cancel
              </Button>
            </Dialog.Cancel>
            <Dialog.Action>
              <Button fullWidth variant="danger-light" onClick={handleConfirmIndexAll}>
                Yes, index all items
              </Button>
            </Dialog.Action>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
};

export default IndexAllButton;
