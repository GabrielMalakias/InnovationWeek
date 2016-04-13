# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)
# AdminUser.create!(email: 'admin@example.com', password: 'password', password_confirmation: 'password')
print 'Creating admin users'
AdminUser.create!(email: 'flavio.andrade@locaweb.com.br', password: 'inicial1234', password_confirmation: 'inicial1234')
print '.'
AdminUser.create!(email: 'kleber.shimabuku@locaweb.com.br', password: 'inicial1234', password_confirmation: 'inicial1234')
puts '.'

print 'Creating analyst users'
Doodle::User::Analyst.create!(login: 'renato', password: 'inicial1234', concurrent_protocols: 3)
puts '.'
print 'Creating customer users'
puts '.'
Doodle::User::Customer.create!(login: 'p1m3nt3l', password: 'inicial1234')

print 'Creating channels'
print '.'
Doodle::Channel.create!(name: 'Corporativo')
print '.'
Doodle::Channel.create!(name: 'Hospedagem')
puts '.'
Doodle::Channel.create!(name: 'Email')

print 'Creating text keywords'
print '.'
Doodle::Keyword::Text.create!(name: 'bomdia', value: 'Bom dia! Bem vindo a Locaweb. Em que posso ajudá-lo ?')
print '.'
Doodle::Keyword::Text.create!(name: 'boatarde', value: 'Boa tarde! Bem vindo a Locaweb. Em que posso ajudá-lo ?')
print '.'
Doodle::Keyword::Text.create!(name: 'boanoite', value: 'Boa noite! Bem vindo a Locaweb. Em que posso ajudá-lo ?')
print '.'
Doodle::Keyword::Text.create!(name: 'castor', value: '<img src="http://statics.1wallpaper.net/thumbimg/20150531/beaver-face-teeth-fur.jpg" />')
print '.'
Doodle::Keyword::Text.create!(name: 'manutencao', value: 'No momento alguns de nossos serviços estão em manutenção. Por gentileza acesse <a href=http://statusblog.locaweb.com.br/ target="_blank"> Status Blog Locaweb </a>.')
print '.'

print 'Assigning analysts to channels'
analyst = Doodle::User::Analyst.where(login: 'renato').first
analyst.channels << Doodle::Channel.all
analyst.save
puts '.'

puts 'Done!'
