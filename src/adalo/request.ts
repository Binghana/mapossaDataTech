import { logger } from "firebase-functions/v1";
import MapossaError from "../class/mapossaError";


var axios = require('axios');

const baserUrl = "https://api.adalo.com/v0/apps/bc399ca2-5676-4c50-8077-b98f3f8c9c6f/";

export async function createUserOnAdalo(user: any) {

    var data = JSON.stringify(
        {
            "Email" : user.email,
            "Password":user.password,
            "uid": user.id
        }
        
    );
        logger.log(user)
    var config = {
        method: 'post',
        url:  baserUrl+ 'collections/t_3d82b4b02d8e4a8b823745fbb09a9bdb',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': 'Bearer d0ba757rxo4l7unzobkgo5bsu'
        },
        data : data
      };
    try {
        const response =  await axios(config)
        return response.data;
        
    } catch (error) {
        throw new MapossaError("une erreur est survennue lors de la création du compte adalo " , error);
    }
  
        
}

