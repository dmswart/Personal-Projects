import numpy as np

# column labels: a_in, b_in, a_out, b_out, in, out

transition = np.array([[0, 0, 4/9, 1/9, 4/9, 0], [0, 0, 0.5, 0, 0.5, 0], [4/9, 1/9, 0, 0, 0, 4/9], [0.5, 0, 0, 0, 0, 0.5], [0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 1]])

b = np.matmul(transition, transition)
b = np.matmul(b, b)
b = np.matmul(b, b)
b = np.matmul(b, b)
b = np.matmul(b, b)
b = np.matmul(b, b)
b = np.matmul(b, b)
b = np.matmul(b, b)
b = np.matmul(b, b)
b = np.matmul(b, b)
b = np.matmul(b, b)
b = np.matmul(b, b)
b = np.matmul(b, b)

x = np.array([0, 0, 0, 0.5, 0.5, 0])

np.matmul(x, b)

#should equal [0, 0, 0, 0, 0.66, 0.34]: i.e., 66% in 34% out
