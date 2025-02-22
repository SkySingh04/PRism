import os, sys, random, math
   
def BAD_function(x,y,z):return x+y+z  

class badCLASS:  
 def __init__(self,value):self.value=value  

 def add(self,other):return self.value+other.value  

def  another_function():  
    a=  1+1
    b =2 *3
    c=4/ 5
    d=6   -7  
    
    unused_var = "This variable is never used"  
    
    if(a> 0):print("A is positive")  

    if b < 10:
        print(  "Bad indentation and spacing") 

    if c>5: 
          print("More indentation problems")  
          
    x= "This is a very long line with way too many characters that will trigger the E501 error because it exceeds 79 or 88 characters in length and is unreadable"
    
    try:
       os.mkdir('test')  
    except: print("Error");  
    
    return a+b+c+d

for   i   in range( 10 ):  
    print(  i )  
    
x = [1,2,3,4, 5 ,6 , 7 ,8,9, 10]  
y= ( 10,20,30, 40,  50 )  

z={ "one":1,"two":2 ,"three" :3, "four" : 4 }  

def misaligned_function():
    x = 1  
    y = 2  
    z = 3  
    return x+y+z

def no_docstring():pass  

def unnecessary_lambda(): return (lambda x:x+1)(5)  

if __name__=="__main__":
  print("This is an awful script")  
  another_function()
  obj=badCLASS(10)  
  print(obj.add(badCLASS(5)))
  print(BAD_function(1, 2, 3))  

  print(misaligned_function())  

  print(unnecessary_lambda())
