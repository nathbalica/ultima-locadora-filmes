import rentalsRepository from "../../src/repositories/rentals-repository"
import rentalsService from "services/rentals-service"
import { faker } from "@faker-js/faker"
import { notFoundError } from "errors/notfound-error"
import usersRepository from "repositories/users-repository"
import moviesRepository from "repositories/movies-repository"

describe("Rentals Service Unit Tests", () => {

  describe("getRentals", () => {
    it("should return rentals", async () => {
      jest.spyOn(rentalsRepository, "getRentals").mockImplementationOnce((): any => {
        return [
          { id: 1, date: new Date(), endDate: new Date, userId: 1, closed: false },
          { id: 2, date: new Date(), endDate: new Date, userId: 2, closed: false }
        ]
      })

      const rentals = await rentalsService.getRentals();
      expect(rentals).toEqual(expect.arrayContaining([expect.objectContaining({
        id: expect.any(Number),
        date: expect.any(Date),
        endDate: expect.any(Date),
        userId: expect.any(Number),
        closed: expect.any(Boolean)
      })]))

    })

    it("should return a specific rental by id, getRentalById", async () => {
      const mockRental = {
        id: 1,
        date: new Date(),
        endDate: new Date,
        userId: 1,
        closed: false,
        movies: [
          {
            id: 1,
            name: faker.internet.userName(),
            adultsOnly: faker.datatype.boolean(),
            rentalId: 1
          }
        ]
      }

      jest.spyOn(rentalsRepository, "getRentalById").mockResolvedValueOnce(mockRental)
      const rental = await rentalsService.getRentalById(1)
      expect(rental).toEqual(mockRental)

    })

    it("should return a notFoundError", async () => {
    
      jest.spyOn(rentalsRepository, "getRentalById").mockResolvedValueOnce(null)
      const rental = await rentalsService.getRentalById(1)
      expect(rental).rejects.toEqual({name: "NotFoundError", message: "Rental not found."})

    })
  })

  describe("createRental", () => {
    it("should return a notFoundError", async () => {
      const rentalInput = {
        userId: 1,
        moviesId: [1,2]
      }
      jest.spyOn(usersRepository, "getById").mockResolvedValueOnce(null)
      const rental = await rentalsService.createRental(rentalInput)
      expect(rental).rejects.toEqual({name: "NotFoundError", message: "User not found."})

    })

    it("should return a notFoundError when finish Rental", async () => {
      jest.spyOn(rentalsRepository, "getRentalById").mockResolvedValueOnce(null)
      const rental = await rentalsService.finishRental(1)
      expect(rental).rejects.toEqual({name: "NotFoundError", message: "Rental not found."})

    })

    it("should return pendent rental error", async() => {
      const rentalInput = {
        userId: 1,
        moviesId: [1,2]
      }

      const mockUser = {
        id: 1,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        cpf: "123456789",
        birthDate: faker.date.birthdate({ min: 18, mode: "age"})
      }
      
      jest.spyOn(usersRepository, "getById").mockImplementationOnce((): any => {
        return mockUser
      })
      jest.spyOn(rentalsRepository, "getRentalsByUserId").mockImplementationOnce((): any => {
        return [
          { id: 1, date: new Date(), endDate: new Date, userId: 1, closed: false },
          { id: 2, date: new Date(), endDate: new Date, userId: 1, closed: false }
        ]
      })

      const rental = await rentalsService.createRental(rentalInput)
      expect(rental).rejects.toEqual({name: "PendentRentalError", message: "The user already have a rental!"})      
    })

    it("should return pendent rental error", async() => {
      const rentalInput = {
        userId: 1,
        moviesId: [1,2]
      }

      const mockUser = {
        id: 1,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        cpf: "123456789",
        birthDate: faker.date.birthdate({ max: 17, mode: "age"})
      }
      
      jest.spyOn(usersRepository, "getById").mockImplementationOnce((): any => {
        return mockUser
      })
      jest.spyOn(rentalsRepository, "getRentalsByUserId").mockImplementationOnce((): any => {
        return []
      })

      it("should return notFoundError if movie is not found",async () => {
        jest.spyOn(moviesRepository, "getById").mockResolvedValueOnce(null)
        
        const movie = await rentalsService.createRental(rentalInput)
        expect(movie).rejects.toEqual({name: "NotFoundError", message: "Movie not found."})
      })

      it("should return notFoundError if movie alredy in a rental",async () => {
        jest.spyOn(moviesRepository, "getById").mockImplementationOnce((): any => {
          return {
            id: 1,
            name: "qualquer",
            adultsOnly: true,
            rentalId: 3
          }
        })
        
        const movie = await rentalsService.createRental(rentalInput)
        expect(movie).rejects.toEqual({name: "MovieInRentalError", message: "Movie alredy in a rental"})
      })

      it("should return cannot see that movie.",async () => {
        jest.spyOn(moviesRepository, "getById").mockImplementationOnce((): any => {
          return {
            id: 1,
            name: "qualquer",
            adultsOnly: true
          }
        })
        
        const movie = await rentalsService.createRental(rentalInput)
        expect(movie).rejects.toEqual({name: "InsufficientAgeError", message: "Cannot see that movie."})
      })
    })

  })

})