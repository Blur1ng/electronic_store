def append_to_list(element, target_list=[]):
    target_list.append(element)
    return target_list

result1 = append_to_list(1)
result2 = append_to_list(2)
result3 = append_to_list(3, [])
result4 = append_to_list(4)

print(result1)
print(result2)
print(result4)
print(id(result1))
print(id(result2))
print(id(result3))
print(id(result4))