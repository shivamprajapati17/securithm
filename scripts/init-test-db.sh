#!/bin/bash
set -e

psql -U securithm -d postgres -c "CREATE DATABASE securithm_ci;" 2>/dev/null || echo "Database securithm_ci already exists"
