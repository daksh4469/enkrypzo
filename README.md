# Enkrypzo
Enkrypzo is a secure, distributed, cloud-based file storage system, which is
used to decrypt the file whenever the user wants to do so. Corresponding to
each file, the user gets a private key which will be used to store the files of the
user on the cloud server in a secure manner.

The website also makes use of GridFS as a file storing system which does not
store the file as a whole but divides the file into chunks and stores each
chunk of data in a separate document, each of maximum size 255kB. The
need for this project arises from the fact that although there exist other
cloud-based file storage systems, all of them require our data as payment for
their services.
Our storage system provides all of the functionality provided by such services,
without the need for the users to violate their privacy. This project is a
must-have for users who value their privacy and like to keep their data secure.

***

### [Deployement link](enkrypzo.herokuapp.com)
