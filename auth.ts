import express = require("express");
import { expressjwt as jwt, GetVerificationKey } from "express-jwt";
import jwksRsa = require("jwks-rsa");
import * as dotenv from "dotenv";
import * as dotenvExpand from "dotenv-expand";

dotenvExpand.expand(dotenv.config());

import { Authorizer, Middleware, getSSLCredentials } from "@aserto/aserto-node";
import { getConfig } from "./config";

export const checkJwt = jwt({
  // Dynamically provide a signing key based on the kid in the header and the signing keys provided by the JWKS endpoint
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: process.env.JWKS_URI,
  }) as GetVerificationKey,

  // Validate the audience and the issuer
  audience: process.env.AUDIENCE,
  issuer: process.env.ISSUER,
  algorithms: ["RS256"],
});

const authzOptions = getConfig();
const ssl = getSSLCredentials(authzOptions.authorizerCertCAFile);
const authClient = new Authorizer(
  {
    authorizerServiceUrl: authzOptions.authorizerServiceUrl,
    authorizerApiKey: authzOptions.authorizerApiKey,
    tenantId: authzOptions.tenantId,
  },
  ssl
);

// authorizer middleware
// currently wired to Aserto, would instead make an AuthZEN REST call
// would still need specific configuration - Authorizer URL, API key, etc

export const authzMiddleware = (store) => {
  const middleware = new Middleware({
    client: authClient,
    policy: {
      name: authzOptions.instanceName,
      instanceLabel: authzOptions.instanceLabel,
      root: authzOptions.policyRoot,
    },
    resourceMapper: async (req: express.Request) => {
      if (!req.params?.id) {
        return {};
      }

      const todo = await store.get(req.params.id);
      return { ownerID: todo.OwnerID };
    },
  });
  return middleware.Authz();
};
