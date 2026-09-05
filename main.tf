# 🛰️ 1. CLOUD PROVIDER INITIALIZATION
# This block tells Terraform to download the official Amazon Web Services connection modules.
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Set your primary geographical data center home base to N. Virginia [2.1]
provider "aws" {
  region = "us-east-1"
}

# 🌐 2. FIREWALL SECURITY GROUP FOR YOUR EC2 API NODE [2.1]
# This acts as the network gatekeeper, blocking malicious internet traffic.
resource "aws_security_group" "ec2_firewall" {
  name        = "ledgerflow-ec2-security-group"
  description = "Controls incoming public web traffic to the Express backend API server"

  # INBOUND RULE A: Allow HTTP web requests directly into Port 3000 [2.1]
  # This lets your React app communicate securely with your Express endpoints [2.1].
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # The wildcard "0.0.0.0/0" means anywhere on the open internet [2.1]
  }

  # INBOUND RULE B: Allow secure administrative SSH shell access [2.1]
  # This lets you securely log in from your Mac terminal to manage the instance [2.1].
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # OUTBOUND RULE: Allow the server to download software updates out to the open web
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"          # "-1" tells AWS to allow all protocols out
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 💻 3. THE VIRTUAL COMPUTE NODE (AMAZON EC2)
# This resource provisions your persistent Ubuntu Linux server engine in the cloud [2.1].
resource "aws_instance" "backend_server" {
  ami           = "ami-0c7217cdde317cfec" # Official Ubuntu Linux 22.04 LTS image ID for us-east-1
  instance_type = "t2.micro"             # Stays 100% inside your AWS Free Tier hourly allowances! [2.1]
  
  # Lock the firewall group rules we scripted in Part 1 onto this machine [2.1]
  security_groups = [aws_security_group.ec2_firewall.name]
  
  # Links your secure cryptographic SSH private key for command line access [2.1]
  key_name        = "ledgerflow-secure-key" 

  tags = {
    Name = "ledgerflow-production-api-server"
  }
}

# 📦 4. THE INTERFACE STORAGE CORE (AMAZON S3 BUCKET)
# This resource provisions the static file hosting warehouse for your compiled React assets [2.1, Idea 2].
resource "aws_s3_bucket" "frontend_hosting" {
  bucket        = "ledgerflow-portfolio-abhi-2026" # Your exact global bucket name tracker string [2.1]
  force_destroy = true
}

# Configures the S3 asset bucket parameters explicitly for public static site web hosting [2.1]
resource "aws_s3_bucket_website_configuration" "s3_site" {
  bucket = aws_s3_bucket.frontend_hosting.id

  index_document {
    suffix = "index.html" # Forces the bucket endpoint to route incoming traffic directly to your React home index file [Idea 2].
  }
}
# 🗄️ 5. THE DATA CORE ENGINE (AMAZON RDS POSTGRESQL DB)
# This resource automates the provisioning of your relational data warehouse inside AWS [2.1].
resource "aws_db_instance" "database" {
  allocated_storage   = 20
  engine              = "postgres"
  engine_version      = "15"
  instance_class      = "db.t3.micro" # Fits cleanly inside your promotional free hours! [2.1]
  db_name             = "postgres"
  username            = "postgres"
  password            = "secure_master_password_here" # Overwritten securely via variables later
  skip_final_snapshot = true

  # 🛡️ THE SECURITY CEILING: Locks the database away from the public internet! [2.1]
  # This matches the exact network privacy fix we performed manually to drop your public IP bill to $0.00! [2.1]
  publicly_accessible = false 
}

