ActiveAdmin.register Doodle::Channel, as: "Channel"  do
  menu parent: 'Chat'
  permit_params :name, user_channels_attributes: [:id, :login, :user_id, :channel_id, :_destroy]

  form do |f|
    f.input :name
    f.has_many :user_channels, allow_destroy: true do |u|
      u.input :user
    end
    f.actions
  end

  show do |channel|
    attributes_table do
      row :name
      row :user do |channel|
        channel.users.map { |u| u.login }.join(", ").html_safe
      end
    end
  end
end
