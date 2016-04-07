ActiveAdmin.register Doodle::Channel, as: "Channel"  do
  menu parent: 'Chat'
  permit_params :name, users_attributes: [:login]

  form do |f|
    f.input :name
    f.has_many :user_channel, new_record: true do |u|
      u.input :login
    end
    f.actions
  end

  before_action only: [:update, :create] do
    @channel = Doodle::Channel.find(permitted_params[:id]) || Doodle::Channel.new
    @channel.users << permitted_params[:channel][:users_attributes].to_a.map { |user| Doodle::User::Analyst.find_by_login user[1]["login"] }
  end

  show do
    attributes_table do
      row :name
      table_for channel.users do
        column "user" do |user|
          user.login
        end
      end
    end
  end
end
