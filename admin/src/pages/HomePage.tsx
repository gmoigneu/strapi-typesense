import { Main } from '@strapi/design-system';
import { useIntl } from 'react-intl';

import { getTranslation } from '../utils/getTranslation';

const HomePage = () => {
  const { formatMessage } = useIntl();

  return (
    <Main>
      <h1 className='sc-blHHSb fTSiDe sc-egkSDF diPmPF'>Typesense collection</h1>
    </Main>
  );
};

export { HomePage };
