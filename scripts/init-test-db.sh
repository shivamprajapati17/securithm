#!/bin/bash
set -e

psql -U auditai -d postgres -c "CREATE DATABASE auditai_ci;" 2>/dev/null || echo "Database auditai_ci already exists"
