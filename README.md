# FindMyCamp 🏕️

![Image 1](https://i.imgur.com/vxlwxfO.png)
![Image 2](https://i.imgur.com/RSdHpky.png)  
![Image 3](https://i.imgur.com/3oU80lM.png)

FindMyCamp is a platform for discovering and managing campgrounds. With FindMyCamp, users can effortlessly create, explore, and review campgrounds, while administrators have the power to oversee and enhance the platform's functionality. FindMyCamp provides a dynamic and user-friendly experience, making camping adventures easier than ever.

## Key Features
- **Campground Management** - Users can effortlessly create, edit, and delete campgrounds.
- **Review Control** - Users have the ability to write and manage their campground reviews, including deletion if needed.
- **Interactive Map Exploration** - Explore and search for campgrounds using the integrated MapBox API for a dynamic map experience.
- **Cloud-Based Image Storage** - Campground images are securely stored in the cloud via Cloudinary.
- **Admin Authority** - Administrators possess the power to edit and remove campgrounds, manage user accounts, and oversee campground reviews.
- **Comprehensive Dashboard** - Admins can access a detailed summary of campgrounds through an intuitive admin dashboard.

## Technologies Used

FindMyCamp is built using a robust tech stack:

- **Backend**: Node.js and Express
- **Database**: MongoDB
- **Frontend**: EJS, HTML, CSS
- **Authentication**: Passport.js for users, Bcrypt for admin

## Run it Locally
1. **Install MongoDB**: [Install MongoDB](https://www.mongodb.com/) on your system.
2. **Get API Keys**: Create accounts on Cloudinary and MapBox to obtain API keys and secrets.
3. **Clone and Install:**:

```
git clone https://github.com/renjithroy/Find-My-Camp.git
cd campground
npm install
```

4. **Set Environment Variables:**
Create a .env file in the project's root directory and add the following:  

```
DB_URL='<your_mongodb_url>'
MAPBOX_TOKEN='<your_mapbox_token>'
API_SECRET='<your_api_secret>'
CLOUDINARY_CLOUD_NAME='<your_cloudinary_cloud_name>'
CLOUDINARY_KEY='<your_cloudinary_key>'
CLOUDINARY_SECRET='<your_cloudinary_secret>'
```

5. **Run the Application:**:

Use command ```node app.js``` in the terminal and ```mongosh``` in another terminal to start the node server and mongo database.

Then go to [localhost:3000](http://localhost:3000/).

To get maps working check [this](https://docs.mapbox.com/) out.

## Contact

If you have any questions or want to reach out to the me, feel free to contact me at [renjithroy06@gmail.com](mailto:renjithroy06@gmail.com).

## Happy camping with FindMyCamp! 🏕️