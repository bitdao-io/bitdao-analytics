terraform {
  required_version = ">= 1.2.4"

  backend "s3" {
    bucket = "windranger-terraform-state"
    region = "us-east-1"
    key    = "analytics-gha.tfstate"
  }
}

provider "aws" {
  region = "us-east-1"
}