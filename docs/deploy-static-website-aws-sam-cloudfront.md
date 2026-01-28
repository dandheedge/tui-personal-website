# How to Deploy a Static Website to AWS with S3, CloudFront, and GitHub Actions CI/CD

In this tutorial, I'll walk you through my journey of deploying a personal website to AWS using Infrastructure as Code (IaC). By the time you finish reading, you'll have learned how to build a fully automated deployment pipeline where every push to your main branch automatically updates your live website — giving you the same developer experience as platforms like Vercel or Netlify, but running entirely on your own AWS infrastructure.

## Table of Contents

- [What We're Building](#what-were-building)
- [Prerequisites](#prerequisites)
- [Understanding the Architecture](#understanding-the-architecture)
- [Part 1: Setting Up AWS CLI](#part-1-setting-up-aws-cli)
- [Part 2: Creating the SSL Certificate (ACM)](#part-2-creating-the-ssl-certificate-acm)
- [Part 3: Creating the GitHub OIDC Role](#part-3-creating-the-github-oidc-role)
- [Part 4: Creating the Main Infrastructure](#part-4-creating-the-main-infrastructure)
- [Part 5: Setting Up GitHub Actions CI/CD](#part-5-setting-up-github-actions-cicd)
- [Part 6: Deploying Everything](#part-6-deploying-everything)
- [Part 7: Configuring GitHub Secrets](#part-7-configuring-github-secrets)
- [Part 8: Testing the Deployment](#part-8-testing-the-deployment)
- [Cost Breakdown](#cost-breakdown)
- [Troubleshooting](#troubleshooting)
- [Conclusion](#conclusion)

---

## What We're Building

We're creating a production-ready static website hosting setup with:

- **Amazon S3** — Stores our website files (HTML, CSS, JS, images)
- **Amazon CloudFront** — CDN that serves content globally with low latency
- **AWS Certificate Manager (ACM)** — Free SSL/TLS certificate for HTTPS
- **Amazon Route 53** — DNS management for our custom domain
- **GitHub Actions** — Automated CI/CD pipeline
- **AWS SAM** — Infrastructure as Code to define all resources

Once everything is set up, you'll have a seamless workflow where pushing code to GitHub automatically builds and deploys your website, eliminating the need for manual uploads or clicking through the AWS Console.

---

## Prerequisites

Before we dive in, let's make sure you have everything you need to follow along:

1. **An AWS Account** — If you don't have one yet, you can [sign up here](https://aws.amazon.com/) for free
2. **AWS CLI installed** — This lets you interact with AWS from your terminal ([installation guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html))
3. **AWS SAM CLI installed** — We'll use this for deploying our infrastructure as code ([installation guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html))
4. **A domain name** — I'm using `damarrama.com` which I purchased from a domain registrar, but any domain will work
5. **A GitHub repository** — This is where your website code will live
6. **GitHub CLI (optional)** — Not required, but it makes setting up secrets much easier

---

## Understanding the Architecture

Before we dive into the code, let's understand how all the pieces fit together:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   GitHub Repo   │────▶│  GitHub Actions │────▶│    S3 Bucket    │
│   (source)      │     │  (build+deploy) │     │   (dist files)  │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Route53      │────▶│   CloudFront    │────▶│   ACM Cert      │
│  (DNS records)  │     │     (CDN)       │     │  (SSL/HTTPS)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Here's how everything flows together:**

When you push code to GitHub, it triggers GitHub Actions automatically. The workflow then builds your site using whatever tool you prefer (Vite, Next.js, or any other static site generator), syncs the built files to S3, and invalidates the CloudFront cache so your changes go live immediately. Your users then access the site through CloudFront, which serves the content over HTTPS from edge locations closest to them.

**Why do we need CloudFront in front of S3?**

While S3 alone can host a website, it only supports HTTP and doesn't provide HTTPS out of the box. By placing CloudFront in front of S3, we gain several important benefits: HTTPS support with your custom domain, a global CDN that delivers content faster to users worldwide, built-in DDoS protection, and intelligent caching for better performance.

---

## Part 1: Setting Up AWS CLI

First, configure your AWS CLI with your credentials:

```bash
aws configure
```

You'll be prompted for:
- **AWS Access Key ID** — From your IAM user
- **AWS Secret Access Key** — From your IAM user
- **Default region** — I used `ap-southeast-1` (Singapore)
- **Default output format** — `json` works well

Verify it's working:

```bash
aws sts get-caller-identity
```

You should see your account ID and user ARN.

---

## Part 2: Creating the SSL Certificate (ACM)

### Why us-east-1?

Here's something that trips up many people: **CloudFront requires certificates to be in the `us-east-1` region**, regardless of where your other resources are. This is because CloudFront is a global service.

### Create the Certificate Template

Create a file called `acm-certificate.yaml`:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: ACM Certificate for CloudFront (must be in us-east-1)

Parameters:
  DomainName:
    Type: String
    Default: damarrama.com

Resources:
  Certificate:
    Type: AWS::CertificateManager::Certificate
    Properties:
      DomainName: !Ref DomainName
      SubjectAlternativeNames:
        - !Sub 'www.${DomainName}'
      ValidationMethod: DNS

Outputs:
  CertificateArn:
    Value: !Ref Certificate
    Description: Use this ARN in the main stack
    Export:
      Name: DamarramaCertificateArn
```

**Let me explain what's happening in this template.** We're requesting a certificate that covers both the apex domain (`damarrama.com`) and the www subdomain (`www.damarrama.com`). By setting `ValidationMethod: DNS`, we're telling AWS that we'll prove domain ownership by adding a special CNAME record to our DNS configuration — this is more reliable than email validation and can be automated.

### Deploy the Certificate

```bash
aws cloudformation deploy \
  --template-file acm-certificate.yaml \
  --stack-name damarrama-certificate \
  --region us-east-1
```

### Validate the Certificate

After deployment, you need to validate that you own the domain:

1. Go to **AWS Console → Certificate Manager** (make sure you're in `us-east-1`)
2. Find your certificate (it will show "Pending validation")
3. Click on it and find the CNAME record details
4. Add this CNAME record to your DNS (Route 53 or your domain registrar)

The certificate status will change to "Issued" once validated (usually within a few minutes).

### Get the Certificate ARN

```bash
aws acm list-certificates --region us-east-1
```

Keep this ARN handy — you'll need to reference it when deploying the main infrastructure stack:
```
arn:aws:acm:us-east-1:123456789012:certificate/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## Part 3: Creating the GitHub OIDC Role

### What is OIDC and Why Use It?

Traditionally, you'd create an IAM user with access keys and store those keys as GitHub secrets. However, this approach has a significant security flaw: those keys never expire and can potentially be leaked.

**OIDC (OpenID Connect)** is more secure:
- No long-lived credentials stored in GitHub
- GitHub proves its identity to AWS using tokens
- Tokens are short-lived and scoped to specific workflows

### Create the OIDC Role Template

Create `github-oidc-role.yaml`:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: IAM Role for GitHub Actions OIDC

Parameters:
  GitHubOrg:
    Type: String
    Default: your-github-username  # Change this!
  GitHubRepo:
    Type: String
    Default: your-repo-name  # Change this!

Resources:
  GitHubOIDCProvider:
    Type: AWS::IAM::OIDCProvider
    Properties:
      Url: https://token.actions.githubusercontent.com
      ClientIdList:
        - sts.amazonaws.com
      ThumbprintList:
        - 6938fd4d98bab03faadb97b34396831e3780aea1

  GitHubActionsRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: github-actions-deploy-role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Federated: !Ref GitHubOIDCProvider
            Action: sts:AssumeRoleWithWebIdentity
            Condition:
              StringEquals:
                token.actions.githubusercontent.com:aud: sts.amazonaws.com
              StringLike:
                token.actions.githubusercontent.com:sub: !Sub 'repo:${GitHubOrg}/${GitHubRepo}:*'
      Policies:
        - PolicyName: DeployPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:*
                  - cloudfront:*
                  - cloudformation:*
                  - iam:*
                  - route53:*
                  - acm:*
                Resource: '*'

Outputs:
  RoleArn:
    Value: !GetAtt GitHubActionsRole.Arn
```

**Important:** Make sure to change `GitHubOrg` and `GitHubRepo` to match your GitHub username and repository name!

**Let me walk you through what this template does.** First, we create an OIDC provider that establishes a trust relationship with GitHub. Then, we create an IAM role with a carefully crafted trust policy that ensures only GitHub Actions running from YOUR specific repository can assume this role. Finally, we attach a policy that grants the necessary permissions for deploying to S3, CloudFront, and other AWS services we need.

### Deploy the OIDC Role

```bash
aws cloudformation deploy \
  --template-file github-oidc-role.yaml \
  --stack-name github-oidc-role \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-southeast-1
```

### Get the Role ARN

```bash
aws cloudformation describe-stacks \
  --stack-name github-oidc-role \
  --query 'Stacks[0].Outputs[?OutputKey==`RoleArn`].OutputValue' \
  --output text
```

Make sure to save this ARN somewhere safe, as you'll need it later when configuring GitHub secrets:
```
arn:aws:iam::123456789012:role/github-actions-deploy-role
```

---

## Part 4: Creating the Main Infrastructure

Now for the main event — our S3 bucket, CloudFront distribution, and DNS records.

### Create the SAM Template

Create `template.yaml`:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: Static website hosting with S3 + CloudFront + Route53

Parameters:
  DomainName:
    Type: String
    Default: damarrama.com
  CertificateArn:
    Type: String
    Description: ACM Certificate ARN (must be in us-east-1 for CloudFront)

Resources:
  # S3 Bucket for website files
  WebsiteBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${DomainName}-website'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

  # Bucket policy for CloudFront OAC
  WebsiteBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref WebsiteBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowCloudFrontOAC
            Effect: Allow
            Principal:
              Service: cloudfront.amazonaws.com
            Action: s3:GetObject
            Resource: !Sub '${WebsiteBucket.Arn}/*'
            Condition:
              StringEquals:
                AWS:SourceArn: !Sub 'arn:aws:cloudfront::${AWS::AccountId}:distribution/${CloudFrontDistribution}'

  # CloudFront Origin Access Control
  CloudFrontOAC:
    Type: AWS::CloudFront::OriginAccessControl
    Properties:
      OriginAccessControlConfig:
        Name: !Sub '${DomainName}-oac'
        OriginAccessControlOriginType: s3
        SigningBehavior: always
        SigningProtocol: sigv4

  # CloudFront Distribution
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Enabled: true
        DefaultRootObject: index.html
        Aliases:
          - !Ref DomainName
          - !Sub 'www.${DomainName}'
        Origins:
          - Id: S3Origin
            DomainName: !GetAtt WebsiteBucket.RegionalDomainName
            S3OriginConfig:
              OriginAccessIdentity: ''
            OriginAccessControlId: !GetAtt CloudFrontOAC.Id
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6
          Compress: true
        CustomErrorResponses:
          - ErrorCode: 403
            ResponseCode: 200
            ResponsePagePath: /index.html
          - ErrorCode: 404
            ResponseCode: 200
            ResponsePagePath: /index.html
        ViewerCertificate:
          AcmCertificateArn: !Ref CertificateArn
          SslSupportMethod: sni-only
          MinimumProtocolVersion: TLSv1.2_2021
        HttpVersion: http2and3
        PriceClass: PriceClass_100

  # Route53 Hosted Zone
  HostedZone:
    Type: AWS::Route53::HostedZone
    Properties:
      Name: !Ref DomainName

  # DNS Record - Apex domain
  DNSRecordApex:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZone
      Name: !Ref DomainName
      Type: A
      AliasTarget:
        DNSName: !GetAtt CloudFrontDistribution.DomainName
        HostedZoneId: Z2FDTNDATAQYW2

  # DNS Record - WWW subdomain
  DNSRecordWWW:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZone
      Name: !Sub 'www.${DomainName}'
      Type: A
      AliasTarget:
        DNSName: !GetAtt CloudFrontDistribution.DomainName
        HostedZoneId: Z2FDTNDATAQYW2

Outputs:
  WebsiteBucketName:
    Value: !Ref WebsiteBucket
    Export:
      Name: WebsiteBucketName

  CloudFrontDistributionId:
    Value: !Ref CloudFrontDistribution
    Export:
      Name: CloudFrontDistributionId

  CloudFrontDomainName:
    Value: !GetAtt CloudFrontDistribution.DomainName

  NameServers:
    Value: !Join [', ', !GetAtt HostedZone.NameServers]
    Description: Update your domain registrar with these name servers

  WebsiteUrl:
    Value: !Sub 'https://${DomainName}'
    Description: Website URL
```

### Understanding the Key Components

#### S3 Bucket (Private)
```yaml
PublicAccessBlockConfiguration:
  BlockPublicAcls: true
  BlockPublicPolicy: true
  IgnorePublicAcls: true
  RestrictPublicBuckets: true
```

Notice how we keep the bucket completely private with all public access blocked. This is intentional — we don't want anyone accessing our S3 bucket directly. Instead, only CloudFront will be able to read from it using Origin Access Control (OAC), which adds an extra layer of security.

#### Origin Access Control (OAC)
```yaml
CloudFrontOAC:
  Type: AWS::CloudFront::OriginAccessControl
  Properties:
    OriginAccessControlConfig:
      SigningBehavior: always
      SigningProtocol: sigv4
```

OAC is the modern, secure way for CloudFront to access private S3 buckets. It uses AWS Signature Version 4 to sign requests.

#### CloudFront Cache Policy
```yaml
CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6
```

This is AWS's managed "CachingOptimized" policy — perfect for static websites with a 1-year default TTL.

#### Custom Error Responses (for SPAs)
```yaml
CustomErrorResponses:
  - ErrorCode: 403
    ResponseCode: 200
    ResponsePagePath: /index.html
  - ErrorCode: 404
    ResponseCode: 200
    ResponsePagePath: /index.html
```

For Single Page Applications (React, Vue, etc.), this ensures that all routes return `index.html` and let the client-side router handle navigation.

#### The Magic Number: Z2FDTNDATAQYW2
```yaml
HostedZoneId: Z2FDTNDATAQYW2
```

If you're wondering whether this is a typo, don't worry — it's not! This is CloudFront's global hosted zone ID, and every CloudFront distribution uses this exact same ID when creating Route 53 alias records. It's one of those AWS quirks you just need to know about.

### Create SAM Configuration

Create `samconfig.toml`:

```toml
version = 0.1

[default.global.parameters]
stack_name = "damarrama-website"
region = "ap-southeast-1"

[default.build.parameters]
cached = true
parallel = true

[default.deploy.parameters]
capabilities = "CAPABILITY_IAM CAPABILITY_AUTO_EXPAND"
confirm_changeset = false
resolve_s3 = true
parameter_overrides = "DomainName=damarrama.com"
```

---

## Part 5: Setting Up GitHub Actions CI/CD

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  AWS_REGION: ap-southeast-1

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Build
        run: bun run build

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Setup SAM
        uses: aws-actions/setup-sam@v2

      - name: SAM Build
        run: sam build

      - name: SAM Deploy
        run: |
          sam deploy --no-fail-on-empty-changeset \
            --parameter-overrides CertificateArn=${{ secrets.ACM_CERTIFICATE_ARN }}

      - name: Sync to S3
        run: |
          # Sync assets with long cache (1 year)
          aws s3 sync dist/ s3://${{ secrets.S3_BUCKET_NAME }} \
            --delete \
            --cache-control "max-age=31536000,public" \
            --exclude "index.html" \
            --exclude "*.xml" \
            --exclude "*.txt"

          # index.html - no cache (always fresh)
          aws s3 cp dist/index.html s3://${{ secrets.S3_BUCKET_NAME }}/index.html \
            --cache-control "no-cache,no-store,must-revalidate"

          # sitemap and robots - 24 hour cache
          aws s3 cp dist/sitemap.xml s3://${{ secrets.S3_BUCKET_NAME }}/sitemap.xml \
            --cache-control "max-age=86400,public"

          aws s3 cp dist/robots.txt s3://${{ secrets.S3_BUCKET_NAME }}/robots.txt \
            --cache-control "max-age=86400,public"

      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

### Understanding the Cache Strategy

| File Type | Cache Duration | Why |
|-----------|----------------|-----|
| JS/CSS/Images | 1 year | Filenames include hashes, so new builds = new files |
| index.html | No cache | Entry point must always be fresh |
| sitemap.xml | 24 hours | Changes occasionally |
| robots.txt | 24 hours | Rarely changes |

This caching strategy strikes a nice balance — your users get instant updates when you deploy new content, while static assets remain cached for optimal performance.

---

## Part 6: Deploying Everything

Now let's deploy everything in the correct order:

### Step 1: Build and Deploy Main Stack

```bash
sam build
sam deploy --parameter-overrides CertificateArn=arn:aws:acm:us-east-1:123456789012:certificate/your-cert-id
```

You'll see output like:

```
CloudFormation outputs from deployed stack
-------------------------------------------------------------------------------------------------
Key                 WebsiteBucketName
Value               damarrama.com-website

Key                 CloudFrontDistributionId
Value               E2G5O0Y61NFFXN

Key                 CloudFrontDomainName
Value               d3vur9twstzpxs.cloudfront.net

Key                 NameServers
Value               ns-1795.awsdns-32.co.uk, ns-520.awsdns-01.net, ...

Key                 WebsiteUrl
Value               https://damarrama.com
-------------------------------------------------------------------------------------------------
```

### Step 2: Update Your Domain's Nameservers

Copy the nameservers from the output and update them at your domain registrar:

```
ns-1795.awsdns-32.co.uk
ns-520.awsdns-01.net
ns-1134.awsdns-13.org
ns-186.awsdns-23.com
```

This tells the internet "Route 53 is now in charge of DNS for this domain."

**Note:** DNS propagation can take up to 48 hours, but usually completes within an hour.

### Step 3: Upload Your Files

Build your site and sync to S3:

```bash
# Build your site
bun run build  # or npm run build

# Sync to S3
aws s3 sync dist/ s3://damarrama.com-website --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E2G5O0Y61NFFXN \
  --paths "/*"
```

---

## Part 7: Configuring GitHub Secrets

For automated deployments, add these secrets to your GitHub repository:

Go to **Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Value |
|-------------|-------|
| `AWS_ROLE_ARN` | `arn:aws:iam::123456789012:role/github-actions-deploy-role` |
| `ACM_CERTIFICATE_ARN` | `arn:aws:acm:us-east-1:123456789012:certificate/xxx` |
| `S3_BUCKET_NAME` | `damarrama.com-website` |
| `CLOUDFRONT_DISTRIBUTION_ID` | `E2G5O0Y61NFFXN` |

Or if you have GitHub CLI installed:

```bash
gh secret set AWS_ROLE_ARN --body "arn:aws:iam::123456789012:role/github-actions-deploy-role"
gh secret set ACM_CERTIFICATE_ARN --body "arn:aws:acm:us-east-1:123456789012:certificate/xxx"
gh secret set S3_BUCKET_NAME --body "damarrama.com-website"
gh secret set CLOUDFRONT_DISTRIBUTION_ID --body "E2G5O0Y61NFFXN"
```

---

## Part 8: Testing the Deployment

### Test Manually

Visit your site:
- https://damarrama.com
- https://www.damarrama.com

Both should load with a valid SSL certificate (padlock icon).

### Test the CI/CD Pipeline

Push a change to trigger the workflow:

```bash
git add .
git commit -m "Test deployment"
git push origin main
```

Check **Actions** tab in your GitHub repo to watch the deployment.

Or trigger manually:

```bash
gh workflow run deploy.yml
```

---

## Cost Breakdown

One of the most common questions about hosting on AWS is "how much will this cost me?" Here's a realistic breakdown of what you can expect to pay monthly:

| Service | Cost | Notes |
|---------|------|-------|
| **Route 53 Hosted Zone** | $0.50 | Fixed monthly fee |
| **Route 53 Queries** | ~$0.01 | $0.40 per million queries |
| **S3 Storage** | ~$0.01 | $0.023/GB, your site is tiny |
| **S3 Requests** | ~$0.01 | Minimal with CloudFront caching |
| **CloudFront** | $0.00 | Free tier: 1TB/month |
| **ACM Certificate** | $0.00 | Always free |
| **Total** | **~$0.50-0.60/month** | |

The good news is that for a personal website with moderate traffic, you're essentially just paying the Route 53 hosted zone fee of $0.50 per month. The other services either fall within free tier limits or cost mere pennies due to the small scale of a personal site.

---

## Troubleshooting

Even with careful setup, you might encounter some issues along the way. Here are the most common problems I've seen and how to solve them.

### "Access Denied" Error

**Problem:** You see an XML error page with "Access Denied"

**Solution:** Your S3 bucket is empty. Upload your files:
```bash
aws s3 sync dist/ s3://your-bucket-name --delete
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

### Certificate "Pending Validation"

**Problem:** Your ACM certificate is stuck in pending status

**Solution:** Add the CNAME record to your DNS:
1. Go to ACM in us-east-1
2. Click on your certificate
3. Copy the CNAME name and value
4. Add it to Route 53 (or your DNS provider)

### "CNAMEAlreadyExists" Error

**Problem:** CloudFront says your domain is already associated with another distribution

**Solution:** You have an existing CloudFront distribution using this domain. Delete it first or use a different domain.

### GitHub Actions Failing on AWS Credentials

**Problem:** "Could not assume role with OIDC"

**Solution:** Check that:
1. Your OIDC role has the correct GitHub org/repo in the trust policy
2. The `id-token: write` permission is in your workflow
3. The role ARN in secrets is correct

---

## Conclusion

Congratulations on making it this far! You've successfully built a fully automated static website deployment pipeline on AWS. From now on, every time you push code to your main branch, the system will automatically build your site, deploy any infrastructure changes, sync your files to S3, and invalidate the CloudFront cache to ensure your visitors see the latest content immediately.

What makes this setup particularly satisfying is the combination of benefits you get: secure HTTPS with your custom domain, a global CDN that delivers your content lightning-fast to users anywhere in the world, fully automated deployments that rival platforms like Vercel and Netlify, complete control over your infrastructure, and all of this for roughly $0.50 per month for a personal site.

### What's Next?

Now that you have the foundation in place, there are plenty of ways to extend this setup. You might consider adding preview deployments for pull requests so you can test changes before merging, setting up monitoring with CloudWatch to track your site's performance, building a contact form using API Gateway and Lambda for serverless form handling, or even implementing A/B testing with CloudFront Functions to experiment with different user experiences.

The possibilities are endless, and the best part is that you now have the knowledge and infrastructure to build upon. Happy deploying!

---

## Project Structure Reference

```
your-website/
├── .github/
│   └── workflows/
│       └── deploy.yml           # CI/CD pipeline
├── dist/                        # Built files (git-ignored)
├── src/                         # Your source code
├── acm-certificate.yaml         # ACM certificate (us-east-1)
├── github-oidc-role.yaml        # GitHub Actions IAM role
├── template.yaml                # Main SAM template
├── samconfig.toml               # SAM configuration
└── package.json                 # Your build scripts
```

## GitHub Secrets Reference

| Secret | Example Value |
|--------|---------------|
| `AWS_ROLE_ARN` | `arn:aws:iam::123456789012:role/github-actions-deploy-role` |
| `ACM_CERTIFICATE_ARN` | `arn:aws:acm:us-east-1:123456789012:certificate/xxx-xxx` |
| `S3_BUCKET_NAME` | `damarrama.com-website` |
| `CLOUDFRONT_DISTRIBUTION_ID` | `E2G5O0Y61NFFXN` |

## Useful Commands

```bash
# Check current AWS identity
aws sts get-caller-identity

# List S3 bucket contents
aws s3 ls s3://your-bucket-name/

# Manually invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"

# Check CloudFormation stack status
aws cloudformation describe-stacks --stack-name your-stack-name

# View GitHub Actions secrets
gh secret list

# Trigger workflow manually
gh workflow run deploy.yml
```
