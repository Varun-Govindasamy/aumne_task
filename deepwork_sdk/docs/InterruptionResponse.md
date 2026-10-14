# InterruptionResponse


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **int** |  | 
**reason** | **str** |  | 
**pause_time** | **datetime** |  | 
**resume_time** | **datetime** |  | 

## Example

```python
from deepwork_sdk.models.interruption_response import InterruptionResponse

# TODO update the JSON string below
json = "{}"
# create an instance of InterruptionResponse from a JSON string
interruption_response_instance = InterruptionResponse.from_json(json)
# print the JSON string representation of the object
print(InterruptionResponse.to_json())

# convert the object into a dict
interruption_response_dict = interruption_response_instance.to_dict()
# create an instance of InterruptionResponse from a dict
interruption_response_from_dict = InterruptionResponse.from_dict(interruption_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


