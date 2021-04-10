import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import OneGraphAuth from "onegraph-auth";
import fetchSupportedServicesQuery from "./fetchSupportedServices.js";
import "./App.css";
import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  HttpLink
} from "@apollo/client";
import { gql } from "@apollo/client";

import OneGraphApolloClient from "onegraph-apollo-client";

const createApolloClient = (authToken) => {
  return new ApolloClient({
    link: new HttpLink({
      uri: "https://hasura.io/learn/graphql",
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }),
    cache: new InMemoryCache()
  });
};

const appId = "beea809f-866b-43cb-883a-dce32d18c155";

const auth = new OneGraphAuth({
  appId: appId
});

const gitHubLink =
  process.env.GITHUB_URL ||
  "https://github.com/OneGraph/authguardian-react-starter";

const exampleUsage = (appId, service) => {
  const componentName = `LoginWith${service.friendlyServiceName.replace(
    /\W/g,
    ""
  )}`;
  return `import OneGraphAuth from "onegraph-auth";

const auth = new OneGraphAuth({
  appId: "${appId}",
});

/* Usage:
  <${componentName} oneGraphAuth={auth} onLogin={() => console.log("User has successfully logged into ${service.friendlyServiceName}.")} />
*/
const ${componentName} = ({ oneGraphAuth, onLogin }) => {
  return (
    <button
      onClick={async () => {
        await oneGraphAuth.login("${service.slug}");
        const isLoggedIn = await oneGraphAuth.isLoggedIn("${service.slug}");
        if (isLoggedIn) {
          onLogin();
        }
      }}
    >
    Log in with ${service.friendlyServiceName}
    </button>
  );
};
`;
};

function App() {
  const [state, setState] = useState({
    supportedServices: [],
    corsConfigurationRequired: null
  });

  useEffect(() => {
    fetchSupportedServicesQuery(auth)
      .then((supportedServices) => {
        console.log(supportedServices);
        setState((oldState) => {
          return {
            ...oldState,
            supportedServices: supportedServices
          };
        });
      })
      // Detect if we haven't configured CORS yet
      .catch((error) => {
        if (
          error.message &&
          error.message.match("not allowed by Access-Control-Allow-Origin")
        ) {
          setState((oldState) => {
            return { ...oldState, corsConfigurationRequired: true };
          });
        }
      });
  }, []);

  const auth = new OneGraphAuth({
    appId: appId
  });
  const accessToken = auth.accessToken();
  console.log(accessToken);

  // const client = new ApolloClient({
  //   headers: {
  //     Authorization: `Bearer ${accessToken}`
  //   },
  //   cache: new InMemoryCache(),
  //   link: new HttpLink({
  //     uri: "https://precious-flounder-61.hasura.app/v1/graphql",
  //   }),
  // });

  const client = new ApolloClient({
    uri: "https://precious-flounder-61.hasura.app/v1/graphql",
    headers: {
      Authorization: `Bearer ${accessToken.accessToken}`
    },
    cache: new InMemoryCache()
  });

  client
    .query({
      query: gql`
        {
          __schema {
            queryType {
              fields {
                name
              }
            }
          }
        }
      `
    })
    .then((result) => console.log(result));

  let decoded = null;

  if (!!accessToken) {
    try {
      const payload = atob(accessToken.accessToken.split(".")[1]);
      decoded = JSON.parse(payload);
      delete decoded["https://onegraph.com/jwt/claims"];
    } catch (e) {
      console.warn(`Error decoding OneGraph jwt for appId=${appId}: `, e);
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Your OneGraph auth <code>JWT</code> preview:
        </p>
        <textarea
          className="jwt-preview"
          rows={15}
          value={
            !!decoded ? JSON.stringify(decoded, null, 2) : "No OneGraph JWT"
          }
          readOnly={true}
        ></textarea>
        <textarea
          className="jwt-preview"
          rows={1}
          value={
            !!accessToken && !!accessToken.accessToken
              ? accessToken.accessToken
              : ""
          }
          readOnly={true}
        ></textarea>
        <button
          onClick={() => {
            auth.destroy();
            setState(() => {
              return { supportedServices: state.supportedServices };
            });
          }}
        >
          Clear local JWT
        </button>
        <p style={{ textAlign: "left" }}>
          {(state.supportedServices || []).map((service) => {
            return (
              <button
                key={service.slug}
                className="service-button"
                onClick={async () => {
                  await auth.login(service.slug);
                  const isLoggedIn = await auth.isLoggedIn(service.slug);
                  setState((oldState) => {
                    return {
                      ...oldState,
                      [service.slug]: isLoggedIn,
                      mostRecentService: service
                    };
                  });
                }}
              >
                {!!state[service.slug] ? " ✓" : ""}{" "}
                <p className="service-button-name">
                  {service.friendlyServiceName}
                </p>
              </button>
            );
          })}
        </p>{" "}
        {!state.mostRecentService ? null : (
          <>
            <h3>
              Add 'Sign in with {state.mostRecentService.friendlyServiceName}'
              to your React app
            </h3>
            <textarea
              className="jwt-preview"
              style={{ marginBottom: "250px" }}
              rows={15}
              value={exampleUsage(appId, state.mostRecentService)}
              readOnly={true}
            ></textarea>
          </>
        )}
      </header>
    </div>
  );
}

export default App;
