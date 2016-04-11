Rails.application.routes.draw do
  devise_for :admin_users, ActiveAdmin::Devise.config
  ActiveAdmin.routes(self)
  mount Doodle::Engine => 'doodle'

  get '/support',  to: 'supports#index'
  get '/customer', to: 'customers#index'
end
