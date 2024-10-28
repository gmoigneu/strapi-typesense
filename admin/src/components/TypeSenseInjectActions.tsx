import { matchRoutes, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useState, useEffect } from 'react';
import IndexAllButton from './IndexAllButton';

const TypeSenseInjectActions = () => {
  const [contentTypes, setContentTypes] = useState<string[]>([]);

  useEffect(() => {
    axios.get(`/strapi-typesense/config`).then((response) => {
      setContentTypes(response.data.contentTypes);
    });
  }, []);


  // Are we on a list view of a content type?
  const currentLocation = useLocation();
  const someRoutes = [
    { path: "/content-manager/collection-types/:collection?" },
  ];
  const matches = matchRoutes(someRoutes, currentLocation);

  // If no content types are configured, do nothing
  if (contentTypes.length === 0 || !matches) {
    return;
  }

  // Is the content type in the list of configured content types?
  if(matches && matches[0] && matches[0].params.collection) {
    if(contentTypes.includes(matches[0].params.collection)) {
      return <IndexAllButton contentType={matches[0].params.collection} />;
    }
  }
  return null;
};

export default TypeSenseInjectActions;
