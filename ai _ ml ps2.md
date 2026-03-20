ai / ml ps2  
Context  
Beyond counting boxes, warehouse operations require  
traceability and verif ication of packing activities. A complete  
system should allow operators to manage packing sessions,  
record video evidence, and store structured data about  
packing operations.  
This challenge focuses on building a full system that  
integrates a Raspberry Pi-based box counting algorithm with  
a mobile or web application that manages sessions, records  
video, stores data, and generates packing reports.  
Objective  
Develop a Linux-based system where the box counting  
algorithm and a web application operate together to manage  
and record packing operations. Object detection will run in a  
Linux environment while a web application controls the  
system and displays the results.  
Functional Requirements (MVP)  
Application Interface:  
Start and stop packing sessions  
Display live video feed  
Display real-time box count  
Adjust YOLO detection parameters (conf idence threshold  
etc.)  
Database System:

|  | Store timestamp |
| :---- | :---- |
|  | Operator ID |
|  | Batch ID |
|  | Box count |
|  | Detection logs |

Video Storage:  
Record compressed video clips during packing sessions  
Store detection overlay video  
Retain recordings for one month  
Automatically archive or delete old recordings  
Problem Statement senior track \- ai / ml ps2  
Challan Generation:  
Generate packing report containing Batch ID, Operator ID, Date &  
Time, and Final Box Count  
Include reference to recorded video  
Export report as PDF  
Technical Constraints  
Object detection and processing must run in a Linux environment  
A web application must control the system and display real-time  
box count  
The web application may be developed using any f ramework or  
IDE  
The application must communicate with the Linux detection  
system  
The system must generate a PDF challan containing the required  
packing details  
No external cloud services allowed  
Expected Deliverables  
Working web or mobile application  
Integration with the Linux-based box counting system  
Local database implementation  
Video recording and compression system  
Automated PDF challan generation f rom the web application  
Demonstration of the full workflow  
Evaluation Focus  
Accuracy of box counting  
System robustness in real-world conditions  
Edge performance optimization  
Quality of system integration  
Usability of the application  
