import { client as generatedClient } from '@/lib/api/generated/client.gen';


// Configure the client with default headers
export const apiClient = generatedClient;



// Function to update Accept-Language header dynamically
export const updateAcceptLanguageHeader = (acceptLanguage: string) => {
  apiClient.setConfig({
    headers: {
      'Accept-Language': acceptLanguage,
    },
  });
};

export default apiClient;