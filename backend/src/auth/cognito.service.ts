import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminGetUserCommand,
  AdminDeleteUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';

@Injectable()
export class CognitoService {
  private readonly logger = new Logger(CognitoService.name);
  private readonly client: CognitoIdentityProviderClient;
  private readonly userPoolId: string;

  constructor(private readonly config: ConfigService) {
    this.userPoolId = config.get('COGNITO_USER_POOL_ID');
    this.client = new CognitoIdentityProviderClient({
      region: config.get('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: config.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: config.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async createUser(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<string> {
    try {
      const createCmd = new AdminCreateUserCommand({
        UserPoolId: this.userPoolId,
        Username: email,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'given_name', Value: firstName },
          { Name: 'family_name', Value: lastName },
        ],
        MessageAction: 'SUPPRESS',
      });

      const result = await this.client.send(createCmd);
      const cognitoUserId = result.User.Username;

      // Set permanent password
      const pwdCmd = new AdminSetUserPasswordCommand({
        UserPoolId: this.userPoolId,
        Username: email,
        Password: password,
        Permanent: true,
      });
      await this.client.send(pwdCmd);

      return cognitoUserId;
    } catch (err) {
      this.logger.error('Cognito createUser failed:', err.message);
      throw err;
    }
  }

  async getUser(email: string) {
    try {
      const cmd = new AdminGetUserCommand({
        UserPoolId: this.userPoolId,
        Username: email,
      });
      return await this.client.send(cmd);
    } catch (err) {
      this.logger.error('Cognito getUser failed:', err.message);
      throw err;
    }
  }

  async deleteUser(email: string): Promise<void> {
    try {
      const cmd = new AdminDeleteUserCommand({
        UserPoolId: this.userPoolId,
        Username: email,
      });
      await this.client.send(cmd);
    } catch (err) {
      this.logger.error('Cognito deleteUser failed:', err.message);
      throw err;
    }
  }
}
