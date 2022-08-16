.DEFAULT_GOAL := build/lambda-update-s3-api.zip

build:
	mkdir -p build

clean:
	rm -r build

build/lambda-update-s3-api.zip: build
	(cd src && zip -r lambda-update-s3-api.zip . && mv lambda-update-s3-api.zip ../build/)
