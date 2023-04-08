interface Environment {
    awsRegion:
    | "us-east-1"
    | "us-east-2"
    | "us-gov-east-1"
    | "us-gov-west-1"
    | "us-iso-east-1"
    | "us-iso-west-1"
    | "us-isob-east-1"
    | "us-west-1"
    | "us-west-2"
    | "af-south-1"
    | "ap-east-1"
    | "ap-northeast-1"
    | "ap-northeast-2"
    | "ap-northeast-3"
    | "ap-south-1"
    | "ap-southeast-1"
    | "ap-southeast-2"
    | "ap-southeast-3"
    | "ca-central-1"
    | "cn-north-1"
    | "cn-northwest-1"
    | "eu-central-1"
    | "eu-central-2"
    | "eu-north-1"
    | "eu-south-1"
    | "eu-south-2"
    | "eu-west-1"
    | "eu-west-2"
    | "eu-west-3"
    | "me-central-1"
    | "me-south-1"
    | "sa-east-1";
    dynamo: {
        UserTable: {
            tableName: string;
            arn: string;
        },
        TokenTable: {
            tableName: string;
            arn: string;
        },
        TenantTable: {
            tableName: string;
            arn: string;
        },
        TextCategoryTable: {
            tableName: string;
            arn: string;
        },
    };
    lambda: {
        subnets: string[];
        securityGroupIds: string[];
    };
    cognito: {
        userPoolArn: string;
        userPoolId: string;
        idclient: string;
    };
}

const environment: Environment = {
    awsRegion: "eu-west-2",
    dynamo: {
        UserTable: {
            tableName: "userTable",
            arn: "arn:aws:dynamodb:eu-west-2:574522373582:table/userData",
        },
        TokenTable: {
            tableName: "TokenTable",
            arn: "arn:aws:dynamodb:eu-west-2:574522373582:table/TokenTable",
        },
        TenantTable: {
            tableName: "TenantTable",
            arn: "arn:aws:dynamodb:eu-west-2:574522373582:table/TenantTable",
        },
        TextCategoryTable: {
            tableName: "TextCategoryTable",
            arn: "arn:aws:dynamodb:eu-west-2:574522373582:table/TextCategoryTable",
        },

    },
    lambda: {
        subnets: [
            "subnet-0de1dc6fef8929d5a",
            "subnet-0b8b8f5d5cf0bfc31",
            "subnet-0dd35592ca19a9ed3",
        ],
        securityGroupIds: ["sg-0bc7f6220021d8080"],
    },
    cognito: {
        userPoolArn:
            "arn:aws:cognito-idp:eu-west-2:574522373582:userpool/eu-west-2_tleAXoqbb",
        userPoolId:
            "eu-west-2_tleAXoqbb",
        idclient:
            "4aftvoo24j5sudsk0mjqcqcpeh",
    },
};

export { environment, Environment };
