/*
- Controllers don't directly talk to models.
- Services have business logic, so they don't directly talk to models.
- Repository talks to models.
*/
/*
Follow this Documentation : 

- https://sequelize.org/docs/v6/core-concepts/model-querying-basics/
- https://sequelize.org/docs/v6/core-concepts/model-querying-finders/
*/

/*
We have removed the try-catch block from here because now we will handle logical errors inside the airplane-service file.
*/
const { StatusCodes } = require("http-status-codes");
const { Logger } = require("../config");
const AppError = require("../utils/errors/app-error");
const { Sequelize } = require("sequelize");
const { Flight, Airplane, Airport, City } = require("../models");
const db = require("../models"); // get the db object that gets returned from the models index file  - To perform raw query in Sequelize

class CrudRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    const response = await this.model.create(data);
    return response;
  }

  async destroy(data) {
    const response = await this.model.destroy({
      where: {
        id: data,
      },
    });
    // We will throw an error if we are unable to find a response
    if (!response) {
      throw new AppError(
        "The data for the given ID could not be found",
        StatusCodes.NOT_FOUND
      );
    }
    return response;
  }

  async get(data) {
    const response = await this.model.findByPk(data, {
      include: [
        {
          // Join is already made on the Primary Key Column
          // Eager Loading - Eager Loading is the act of querying data of several models at once (one 'main' model and one or more associated models). At the SQL level, this is a query with one or more joins.
          model: Airplane, // The entire Airplane Model Object will be fetched by airplaneId inside the Flight Model Object
          required: true, // When eager loading, we can force the query to return only records which have an associated model, effectively converting the query from the default OUTER JOIN to an INNER JOIN. This is done with the `required: true` option
        },
        {
          // Join is not made on the Primary Key Column, rather it is made on the Airport.code (Not Primary Key Column)
          model: Airport,
          required: true,
          as: "departureAirport", // Airport is associated to Flight multiple times. To identify the correct association, you must use the 'as' keyword to specify the alias of the association you want to include.
          // departureId is based on Airport.code and not based on Airport.id. But by default it will try to do the mapping on Airport.id but we want to do the mapping on Airport.code so for that we can specifically mention on what columns u want the comparison of the join to happen using `on:` property
          // On which particular columns u want to do the corresponding mapping
          on: {
            col1: Sequelize.where(
              // which columns to compare in the joining of 2 tables
              Sequelize.col("Flight.departureAirportId"),
              "=",
              Sequelize.col("departureAirport.code")
            ),
          },
          include: {
            model: City,
            required: true,
          },
        },
        {
          // Join is not made on the Primary Key Column, rather it is made on the Airport.code (Not Primary Key Column)

          model: Airport, // The entire Airport Model Object will be fetched by airplaneId inside the Flight Model Object
          required: true,
          as: "arrivalAirport", // Airport is associated to Flight multiple times. To identify the correct association, you must use the 'as' keyword to specify the alias of the association you want to include.
          on: {
            col1: Sequelize.where(
              Sequelize.col("Flight.arrivalAirportId"),
              "=",
              Sequelize.col("arrivalAirport.code")
            ),
          },
          include: {
            model: City,
            required: true,
          },
        },
      ],
    });
    // We will throw an error if we are unable to find a response
    if (!response) {
      throw new AppError(
        "The data for the given ID could not be found",
        StatusCodes.NOT_FOUND
      );
    }
    return response;
  }

  async getAll() {
    const response = await this.model.findAll();
    return response;
  }

  async update(id, data) {
    const tableAttributes = Object.keys(this.model.rawAttributes);
    const reqAttributes = Object.keys(data);
    const hasAllAttributes = reqAttributes.every((elem) =>
      tableAttributes.includes(elem)
    );
    if (hasAllAttributes) {
      const response = await this.model.update(data, {
        where: {
          id: id,
        },
      });

      if (response[0] == 0) {
        throw new AppError(
          "The data for the given ID could not be found",
          StatusCodes.NOT_FOUND
        );
      }
      return response;
    } else {
      throw new AppError(
        "The column for the given ID could not be found",
        StatusCodes.NOT_FOUND
      );
    }
  }
}

module.exports = CrudRepository;

/* 
Extremely complex queries are not possible in Sequelize.
The better way is to write a raw query in Sequelize.

Follow this Documentation to write raw query in Sequelize:
- https://sequelize.org/docs/v6/core-concepts/raw-queries/

*/
