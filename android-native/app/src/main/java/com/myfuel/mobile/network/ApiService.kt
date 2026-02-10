package com.myfuel.mobile.network

import com.myfuel.mobile.models.ApiResponse
import retrofit2.http.GET
import retrofit2.http.Query

interface ApiService {
    @GET("apiv1/nearby")
    suspend fun getNearbyStations(
        @Query("lat") latitude: Double,
        @Query("lon") longitude: Double
    ): ApiResponse
}
