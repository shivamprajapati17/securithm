def handler(request):
    return {
        "statusCode": 200,
        "headers": {"content-type": "application/json"},
        "body": '{"status": "ok", "test": "minimal function works"}'
    }
