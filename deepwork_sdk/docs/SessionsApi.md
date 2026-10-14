# deepwork_sdk.SessionsApi

All URIs are relative to *http://127.0.0.1:8000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**complete_session_sessions_session_id_complete_patch**](SessionsApi.md#complete_session_sessions_session_id_complete_patch) | **PATCH** /sessions/{session_id}/complete | Complete Session
[**create_session_sessions_post**](SessionsApi.md#create_session_sessions_post) | **POST** /sessions/ | Create Session
[**get_history_sessions_history_get**](SessionsApi.md#get_history_sessions_history_get) | **GET** /sessions/history | Get History
[**get_session_sessions_session_id_get**](SessionsApi.md#get_session_sessions_session_id_get) | **GET** /sessions/{session_id} | Get Session
[**pause_session_sessions_session_id_pause_patch**](SessionsApi.md#pause_session_sessions_session_id_pause_patch) | **PATCH** /sessions/{session_id}/pause | Pause Session
[**resume_session_sessions_session_id_resume_patch**](SessionsApi.md#resume_session_sessions_session_id_resume_patch) | **PATCH** /sessions/{session_id}/resume | Resume Session
[**start_session_sessions_session_id_start_patch**](SessionsApi.md#start_session_sessions_session_id_start_patch) | **PATCH** /sessions/{session_id}/start | Start Session


# **complete_session_sessions_session_id_complete_patch**
> SessionResponse complete_session_sessions_session_id_complete_patch(session_id)

Complete Session

### Example


```python
import deepwork_sdk
from deepwork_sdk.models.session_response import SessionResponse
from deepwork_sdk.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://127.0.0.1:8000
# See configuration.py for a list of all supported configuration parameters.
configuration = deepwork_sdk.Configuration(
    host = "http://127.0.0.1:8000"
)


# Enter a context with an instance of the API client
with deepwork_sdk.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = deepwork_sdk.SessionsApi(api_client)
    session_id = 56 # int |

    try:
        # Complete Session
        api_response = api_instance.complete_session_sessions_session_id_complete_patch(session_id)
        print("The response of SessionsApi->complete_session_sessions_session_id_complete_patch:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SessionsApi->complete_session_sessions_session_id_complete_patch: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **session_id** | **int**|  |

### Return type

[**SessionResponse**](SessionResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **create_session_sessions_post**
> SessionResponse create_session_sessions_post(session_create)

Create Session

### Example


```python
import deepwork_sdk
from deepwork_sdk.models.session_create import SessionCreate
from deepwork_sdk.models.session_response import SessionResponse
from deepwork_sdk.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://127.0.0.1:8000
# See configuration.py for a list of all supported configuration parameters.
configuration = deepwork_sdk.Configuration(
    host = "http://127.0.0.1:8000"
)


# Enter a context with an instance of the API client
with deepwork_sdk.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = deepwork_sdk.SessionsApi(api_client)
    session_create = deepwork_sdk.SessionCreate() # SessionCreate | 

    try:
        # Create Session
        api_response = api_instance.create_session_sessions_post(session_create)
        print("The response of SessionsApi->create_session_sessions_post:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SessionsApi->create_session_sessions_post: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **session_create** | [**SessionCreate**](SessionCreate.md)|  | 

### Return type

[**SessionResponse**](SessionResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_history_sessions_history_get**
> HistoryResponse get_history_sessions_history_get()

Get History

### Example


```python
import deepwork_sdk
from deepwork_sdk.models.history_response import HistoryResponse
from deepwork_sdk.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://127.0.0.1:8000
# See configuration.py for a list of all supported configuration parameters.
configuration = deepwork_sdk.Configuration(
    host = "http://127.0.0.1:8000"
)


# Enter a context with an instance of the API client
with deepwork_sdk.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = deepwork_sdk.SessionsApi(api_client)

    try:
        # Get History
        api_response = api_instance.get_history_sessions_history_get()
        print("The response of SessionsApi->get_history_sessions_history_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SessionsApi->get_history_sessions_history_get: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**HistoryResponse**](HistoryResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **get_session_sessions_session_id_get**
> SessionResponse get_session_sessions_session_id_get(session_id)

Get Session

### Example


```python
import deepwork_sdk
from deepwork_sdk.models.session_response import SessionResponse
from deepwork_sdk.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://127.0.0.1:8000
# See configuration.py for a list of all supported configuration parameters.
configuration = deepwork_sdk.Configuration(
    host = "http://127.0.0.1:8000"
)


# Enter a context with an instance of the API client
with deepwork_sdk.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = deepwork_sdk.SessionsApi(api_client)
    session_id = 56 # int |

    try:
        # Get Session
        api_response = api_instance.get_session_sessions_session_id_get(session_id)
        print("The response of SessionsApi->get_session_sessions_session_id_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SessionsApi->get_session_sessions_session_id_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **session_id** | **int**|  |

### Return type

[**SessionResponse**](SessionResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **pause_session_sessions_session_id_pause_patch**
> SessionResponse pause_session_sessions_session_id_pause_patch(session_id, pause_request)

Pause Session

### Example


```python
import deepwork_sdk
from deepwork_sdk.models.pause_request import PauseRequest
from deepwork_sdk.models.session_response import SessionResponse
from deepwork_sdk.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://127.0.0.1:8000
# See configuration.py for a list of all supported configuration parameters.
configuration = deepwork_sdk.Configuration(
    host = "http://127.0.0.1:8000"
)


# Enter a context with an instance of the API client
with deepwork_sdk.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = deepwork_sdk.SessionsApi(api_client)
    session_id = 56 # int | 
    pause_request = deepwork_sdk.PauseRequest() # PauseRequest | 

    try:
        # Pause Session
        api_response = api_instance.pause_session_sessions_session_id_pause_patch(session_id, pause_request)
        print("The response of SessionsApi->pause_session_sessions_session_id_pause_patch:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SessionsApi->pause_session_sessions_session_id_pause_patch: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **session_id** | **int**|  | 
 **pause_request** | [**PauseRequest**](PauseRequest.md)|  | 

### Return type

[**SessionResponse**](SessionResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **resume_session_sessions_session_id_resume_patch**
> SessionResponse resume_session_sessions_session_id_resume_patch(session_id)

Resume Session

### Example


```python
import deepwork_sdk
from deepwork_sdk.models.session_response import SessionResponse
from deepwork_sdk.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://127.0.0.1:8000
# See configuration.py for a list of all supported configuration parameters.
configuration = deepwork_sdk.Configuration(
    host = "http://127.0.0.1:8000"
)


# Enter a context with an instance of the API client
with deepwork_sdk.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = deepwork_sdk.SessionsApi(api_client)
    session_id = 56 # int | 

    try:
        # Resume Session
        api_response = api_instance.resume_session_sessions_session_id_resume_patch(session_id)
        print("The response of SessionsApi->resume_session_sessions_session_id_resume_patch:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SessionsApi->resume_session_sessions_session_id_resume_patch: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **session_id** | **int**|  | 

### Return type

[**SessionResponse**](SessionResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **start_session_sessions_session_id_start_patch**
> SessionResponse start_session_sessions_session_id_start_patch(session_id)

Start Session

### Example


```python
import deepwork_sdk
from deepwork_sdk.models.session_response import SessionResponse
from deepwork_sdk.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to http://127.0.0.1:8000
# See configuration.py for a list of all supported configuration parameters.
configuration = deepwork_sdk.Configuration(
    host = "http://127.0.0.1:8000"
)


# Enter a context with an instance of the API client
with deepwork_sdk.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = deepwork_sdk.SessionsApi(api_client)
    session_id = 56 # int | 

    try:
        # Start Session
        api_response = api_instance.start_session_sessions_session_id_start_patch(session_id)
        print("The response of SessionsApi->start_session_sessions_session_id_start_patch:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SessionsApi->start_session_sessions_session_id_start_patch: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **session_id** | **int**|  | 

### Return type

[**SessionResponse**](SessionResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful Response |  -  |
**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)
