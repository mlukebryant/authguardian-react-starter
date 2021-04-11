import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import OneGraphAuth from "onegraph-auth";
import fetchSupportedServicesQuery from "./fetchSupportedServices.js";
import "./App.css";
import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  HttpLink
} from "@apollo/client";

const appId = "beea809f-866b-43cb-883a-dce32d18c155";

const auth = new OneGraphAuth({
  appId: appId
});
const accessToken = auth.accessToken();
console.log(accessToken);

const client = new ApolloClient({
  uri: "https://precious-flounder-61.hasura.app/v1/graphql",
  headers: {
    Authorization: `Bearer ${accessToken.accessToken}`
  },
  cache: new InMemoryCache()
});

const OneGraphWrapper = ({ oneGraphAuth, onLogin }) => {
  const service = {
    service: "GITHUB",
    friendlyServiceName: "GitHub",
    slug: "github",
    supportsOauthLogin: true,
    supportsCustomServiceAuth: true
  };
  return (
    <button
      onClick={async () => {
        await oneGraphAuth.login(`${service.slug}`);
        const isLoggedIn = await oneGraphAuth.isLoggedIn(`${service.slug}`);
        if (isLoggedIn) {
          onLogin();
        }
      }}
    >
      Log in with {service.friendlyServiceName}
    </button>
  );
};

ReactDOM.render(
  <OneGraphWrapper
    oneGraphAuth={auth}
    onLogin={() =>
      console.log(
        "User has successfully logged into ${service.friendlyServiceName}."
      )
    }
  >
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </OneGraphWrapper>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
