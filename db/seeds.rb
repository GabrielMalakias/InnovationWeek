# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)
AdminUser.create!(email: 'admin@example.com', password: 'password', password_confirmation: 'password')
AdminUser.create!(email: 'flavio.andrade@locaweb.com.br', password: 'inicial1234', password_confirmation: 'inicial1234')

Doodle::User::Analyst.create!(login: 'renato', password: 'inicial1234', concurrent_protocols: 3)
Doodle::User::Customer.create!(login: 'p1m3nt3l', password: 'inicial1234')

Doodle::Channel.create!(name: 'Corporativo')
Doodle::Channel.create!(name: 'Hospedagem')
Doodle::Channel.create!(name: 'Email')

analyst = Doodle::User::Analyst.where(login: 'renato').first

analyst.channels << Doodle::Channel.all
analyst.save
