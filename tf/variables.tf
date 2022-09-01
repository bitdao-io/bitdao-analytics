variable "bucket_name" {
  description = "Name of the S3 bucket that will be used to store the files"
  type        = string
}

variable "bitdao_account" {
  type = string
}

variable "bitdao_api_key" {
  type = string
}

variable "main_rpc_url" {
  type = string
}

variable "web3_rpc_url" {
  type = string
}
