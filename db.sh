#!/usr/bin/env bash

PASSWORD=postgres

mkdir .postgis_data 2>/dev/null > /dev/null

## A simple proc for determining if the current
## user is in a group.
ingroup(){ [[ " `id -Gn $2` " == *" $1 "* ]]; }

# Determines if the current user is root.
isroot(){ [[ $EUID = 0 ]]; }

# Determine if we need to use sudo
PFX='sudo'

if ingroup docker; then
	PFX=''
elif isroot; then
	PFX=''
fi

HASH=$(DOCKER_BUILDKIT=1 $PFX docker build -q - < Dockerfile.postgis)

# Run postgis on port 2345
$PFX docker run \
  -v $(pwd)/.pgdata:/var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=$PASSWORD \
  -p 2345:5432 \
  $HASH
