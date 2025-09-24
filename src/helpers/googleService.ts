import { GoogleGeocodeResult, GooglePlaceDetail, AddressComponents, GooglePlaceResult } from '../@types';


export const googlePlaceDetails = (placeId: string): Promise<GooglePlaceDetail> => {
  return new Promise((resolve) => {
    if (!window.google || !placeId) return resolve({} as GooglePlaceDetail);

    const placesService = new window.google.maps.Geocoder();
    placesService.geocode({ placeId }, (result: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
      if (!result || status !== 'OK') return resolve({} as GooglePlaceDetail);

      const formattedResult: GoogleGeocodeResult = {
        results: result as unknown as GooglePlaceResult[],
        status: status.toString()
      };
      
      resolve(_formatAddress(formattedResult));
    });
  });
};

export const _formatAddress = (result: GoogleGeocodeResult): GooglePlaceDetail => {
  // Create an object containing required fields
  const addressComponents: AddressComponents = {};
  result.results[0].address_components.forEach((component) => {
    component.types.forEach((type: string) => {
      if (!(addressComponents[type] && addressComponents[type].length)) {
        addressComponents[type] = [];
      }
      addressComponents[type].push(component.long_name);
    });
  });
  
  // Required: Street address, City, State, ZIP/PIN, Country
  let sublocalities = "";
  if (addressComponents.sublocality && addressComponents.sublocality.length) {
    addressComponents.sublocality.forEach((sublocality: string) => {
      sublocalities += sublocality + " ";
    });
  }
  
  return {
    address:
      (addressComponents.street_number?.length
        ? addressComponents.street_number[0]
        : "") +
      (addressComponents.route?.length
        ? ` ${addressComponents.route[0]}`
        : "") +
      `${sublocalities?.trim().length ? ` ${sublocalities.trim()}` : ""}`,
    county:
      addressComponents.administrative_area_level_2 &&
      addressComponents.administrative_area_level_2.length
        ? addressComponents.administrative_area_level_2[0]
        : "",
    city:
      addressComponents.locality && addressComponents.locality.length
        ? addressComponents.locality[0]
        : addressComponents.administrative_area_level_2 &&
          addressComponents.administrative_area_level_2.length
        ? addressComponents.administrative_area_level_2[0]
        : "",
    state:
      addressComponents.administrative_area_level_1 &&
      addressComponents.administrative_area_level_1.length
        ? addressComponents.administrative_area_level_1[0]
        : "",
    country:
      addressComponents.country && addressComponents.country.length
        ? addressComponents.country[0]
        : "",
    postal:
      addressComponents.postal_code && addressComponents.postal_code.length
        ? addressComponents.postal_code[0]
        : "",
    lat:
      result?.results?.length && result.results[0]?.geometry?.location?.lat()
        ? result.results[0].geometry.location.lat()
        : 0,
    lng:
      result?.results?.length && result.results[0]?.geometry?.location?.lng()
        ? result.results[0].geometry.location.lng()
        : 0,
  };
};



export interface GooglePlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

/**
 * Fetches place predictions using the new Places Autocomplete Data API.
 * @param searchValue The user's input string.
 * @returns A Promise that resolves to an array of formatted GooglePlacePrediction objects.
 */
export const googlePlaceSearch = async (searchValue: string): Promise<GooglePlacePrediction[]> => {
  if (!window.google || !searchValue) {
    return [];
  }

  const sessionToken = new google.maps.places.AutocompleteSessionToken();
  const request: google.maps.places.AutocompleteRequest = {
    input: searchValue,
    includedRegionCodes: ["US"],
    sessionToken,
  };

  try {
    const { suggestions } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
    
    const formattedPredictions: GooglePlacePrediction[] = suggestions
      .filter(suggestion => suggestion.placePrediction)
      .map(suggestion => {
        const placePrediction = suggestion.placePrediction as google.maps.places.PlacePrediction;
        

        const mainText = placePrediction.mainText?.text
        const secondaryText = placePrediction.secondaryText?.text || "";

        return {
          place_id: placePrediction.placeId,
          description: placePrediction.text.text,
          structured_formatting: {
            main_text: mainText || "",
            secondary_text: secondaryText,
          },
        };
      });

    return formattedPredictions;

  } catch (error) {
    console.error("Error fetching place predictions:", error);
    return [];
  }
};